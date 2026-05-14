import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Grid3X3, Settings, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Profile as ProfileType, Post } from "@/types";
import { toast } from "sonner";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const profileId = id || user?.id;
  const isOwnProfile = user?.id === profileId;

  const fetchData = async () => {
    if (!profileId) return;
    setLoading(true);
    const [profileRes, postsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase
        .from("posts")
        .select("*, profiles (*), comments (*, profiles (*)), likes (count)")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false }),
    ]);
    setProfile(profileRes.data as ProfileType | null);
    setPosts((postsRes.data as unknown as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, authLoading, user, navigate]);

  const handleEdit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url || null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          username: editUsername.trim(),
          display_name: editName.trim(),
          bio: editBio.trim() || null,
          avatar_url,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated!");
      setEditOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">@{profile.username}</h1>
          </div>
          {isOwnProfile && (
            <Dialog open={editOpen} onOpenChange={(o) => {
              setEditOpen(o);
              if (o) {
                setEditName(profile.display_name);
                setEditUsername(profile.username);
                setEditBio(profile.bio || "");
                setAvatarPreview(profile.avatar_url || null);
                setAvatarFile(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                      <AvatarImage src={avatarPreview || ""} />
                      <AvatarFallback>{editUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <label className="text-xs text-primary cursor-pointer hover:underline">
                      Change avatar
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
                        setAvatarFile(f);
                        setAvatarPreview(URL.createObjectURL(f));
                      }} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground font-medium">Username</label>
                    <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground font-medium">Display Name</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground font-medium">Bio</label>
                    <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="bg-muted/50 resize-none" rows={3} maxLength={200} />
                  </div>
                  <Button onClick={handleEdit} disabled={saving || !editName.trim() || !editUsername.trim()} className="w-full gradient-bg text-primary-foreground">
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile header */}
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 ring-2 ring-primary/30">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="bg-muted text-lg">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-bold">{profile.display_name}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 border-t border-b border-border py-3">
          <div className="text-center">
            <p className="text-lg font-bold">{posts.length}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
        </div>

        {/* Posts grid */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Grid3X3 className="h-4 w-4" />
            <span>Posts</span>
          </div>
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">No posts yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm">
                  <img src={post.image_url} alt={post.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-sm font-semibold">
                    <span>❤️ {post.likes?.[0]?.count || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                  {isOwnProfile && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Delete this post?")) return;
                        const { error } = await supabase.from("posts").delete().eq("id", post.id);
                        if (error) return toast.error(error.message);
                        toast.success("Post deleted");
                        setPosts((prev) => prev.filter((p) => p.id !== post.id));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
