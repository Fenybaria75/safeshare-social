import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Plus, X, Upload, MessageCircle, AlertTriangle, Shield, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAddComment } from "@/hooks/useComments";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ReelComment {
  id: string;
  content: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface Reel {
  id: string;
  profile_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null };
  reel_likes: { count: number }[];
  comments: ReelComment[];
}

const Reels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const fetchReels = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reels")
      .select("*, profiles(*), reel_likes(count), comments(*, profiles(*))")
      .order("created_at", { ascending: false });
    setReels((data as any) || []);
    if (user) {
      const { data: likes } = await supabase.from("reel_likes").select("reel_id").eq("profile_id", user.id);
      setLikedIds(new Set((likes || []).map((l: any) => l.reel_id)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchReels(); }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel("reel-comments-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => fetchReels())
      .on("postgres_changes", { event: "*", schema: "public", table: "reel_likes" }, () => fetchReels())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleLike = async (reelId: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    const liked = likedIds.has(reelId);
    const next = new Set(likedIds);
    if (liked) {
      next.delete(reelId);
      await supabase.from("reel_likes").delete().eq("reel_id", reelId).eq("profile_id", user.id);
    } else {
      next.add(reelId);
      await supabase.from("reel_likes").insert({ reel_id: reelId, profile_id: user.id });
    }
    setLikedIds(next);
    fetchReels();
  };

  const deleteReel = async (reelId: string) => {
    if (!confirm("Delete this reel?")) return;
    const { error } = await supabase.from("reels").delete().eq("id", reelId);
    if (error) return toast.error(error.message);
    toast.success("Reel deleted");
    fetchReels();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold gradient-text">Reels</h1>
          </div>
          {user && <CreateReelDialog onCreated={fetchReels} />}
        </div>
      </header>

      <main className="max-w-md mx-auto py-4 space-y-6 px-2">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : reels.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No reels yet. Be the first!</p>
        ) : (
          reels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              liked={likedIds.has(reel.id)}
              onLike={() => toggleLike(reel.id)}
              onDelete={() => deleteReel(reel.id)}
              currentUserId={user?.id}
            />
          ))
        )}
      </main>
    </div>
  );
};

function ReelCard({ reel, liked, onLike, onDelete, currentUserId }: {
  reel: Reel; liked: boolean; onLike: () => void; onDelete: () => void; currentUserId?: string;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [text, setText] = useState("");
  const addComment = useAddComment();

  const visible = (reel.comments || []).filter(c => !c.is_hidden);
  const hidden = (reel.comments || []).filter(c => c.is_hidden);
  const isOwner = currentUserId === reel.profile_id;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!currentUserId) { toast.error("Sign in to comment"); return; }
    addComment.mutate({ reelId: reel.id, content: text.trim() }, { onSuccess: () => setText("") });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-8 w-8 ring-2 ring-primary/30">
          <AvatarImage src={reel.profiles?.avatar_url || ""} />
          <AvatarFallback>{reel.profiles?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-semibold flex-1">{reel.profiles?.username}</p>
        {isOwner && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="relative bg-black aspect-[9/16] flex items-center justify-center">
        {reel.media_type === "video" ? (
          <video src={reel.media_url} controls loop playsInline className="w-full h-full object-contain" />
        ) : (
          <img src={reel.media_url} alt={reel.caption || ""} className="w-full h-full object-contain" />
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-4">
          <button onClick={onLike} className="hover:scale-110 transition-transform">
            <Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
          </button>
          <button onClick={() => setShowComments(v => !v)} className="hover:scale-110 transition-transform">
            <MessageCircle className="h-6 w-6 text-foreground hover:text-accent" />
          </button>
          {hidden.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-destructive font-medium">{hidden.length} flagged</span>
            </div>
          )}
        </div>
        <p className="text-sm font-semibold">{reel.reel_likes?.[0]?.count || 0} likes</p>
        {reel.caption && <p className="text-sm"><span className="font-semibold mr-2">{reel.profiles?.username}</span>{reel.caption}</p>}

        {reel.comments?.length > 0 && (
          <button onClick={() => setShowComments(v => !v)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showComments ? "Hide" : "View"} {visible.length} comment{visible.length !== 1 ? "s" : ""}
          </button>
        )}

        {showComments && (
          <div className="space-y-2 pt-1">
            {visible.map(c => (
              <div key={c.id} className="flex gap-2 text-sm">
                <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                  <AvatarImage src={c.profiles?.avatar_url || ""} />
                  <AvatarFallback className="text-[9px]">{c.profiles?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p><span className="font-semibold mr-1.5">{c.profiles?.username}</span>{c.content}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
            {hidden.length > 0 && (
              <div className="pt-2">
                <button onClick={() => setShowHidden(v => !v)} className="flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive">
                  <Shield className="h-3 w-3" />
                  {showHidden ? "Hide" : "Show"} {hidden.length} hidden comment{hidden.length !== 1 ? "s" : ""}
                </button>
                {showHidden && (
                  <div className="space-y-2 mt-2">
                    {hidden.map(c => (
                      <div key={c.id} className="border-2 border-destructive rounded-lg bg-destructive/10 p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <span className="text-xs font-bold text-destructive uppercase tracking-wide">Flagged by AI Moderation</span>
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold mr-1.5 text-destructive">{c.profiles?.username}</span>
                          <span className="italic text-destructive/70 line-through">{c.content}</span>
                        </p>
                        {c.hidden_reason && (
                          <Badge variant="destructive" className="text-[10px]">Reason: {c.hidden_reason}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentUserId && (
          <form onSubmit={submit} className="flex items-center gap-2 pt-2 border-t border-border">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment..."
              className="flex-1 border-0 bg-transparent text-sm h-8 focus-visible:ring-0 px-1" />
            <Button type="submit" variant="ghost" size="sm" disabled={!text.trim() || addComment.isPending}
              className="text-primary font-semibold text-sm hover:text-primary/80 disabled:opacity-30">
              {addComment.isPending ? "..." : "Post"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function CreateReelDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/") && !f.type.startsWith("image/")) {
      toast.error("Pick a video or image"); return;
    }
    if (f.size > 50 * 1024 * 1024) { toast.error("Max 50MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("reels").upload(path, file);
      if (upErr) throw upErr;
      const url = supabase.storage.from("reels").getPublicUrl(path).data.publicUrl;
      const media_type = file.type.startsWith("video/") ? "video" : "image";
      const { error } = await supabase.from("reels").insert({
        profile_id: user.id, media_url: url, media_type, caption: caption.trim() || null,
      });
      if (error) throw error;
      toast.success("Reel posted!");
      setOpen(false); setFile(null); setPreview(null); setCaption("");
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-bg text-primary-foreground gap-1.5">
          <Plus className="h-4 w-4" /> New Reel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Reel</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept="video/*,image/*" onChange={onPick} className="hidden" />
          {preview ? (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[9/16]">
              {file?.type.startsWith("video/") ? (
                <video src={preview} controls className="w-full h-full object-contain" />
              ) : (
                <img src={preview} className="w-full h-full object-contain" alt="" />
              )}
              <button onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value=""; }}
                className="absolute top-2 right-2 bg-background/80 rounded-full p-1.5"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full aspect-[9/16] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Upload className="h-10 w-10" />
              <span className="text-sm">Click to upload video or image</span>
            </button>
          )}
          <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." className="bg-muted/50 resize-none" rows={2} maxLength={300} />
          <Button onClick={submit} disabled={!file || uploading} className="w-full gradient-bg text-primary-foreground">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</> : "Share Reel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Reels;
