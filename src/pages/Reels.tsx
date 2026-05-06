import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Plus, X, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Reel {
  id: string;
  profile_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null };
  reel_likes: { count: number }[];
}

const Reels = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, user, navigate]);

  const fetchReels = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reels")
      .select("*, profiles(*), reel_likes(count)")
      .order("created_at", { ascending: false });
    setReels((data as any) || []);
    if (user) {
      const { data: likes } = await supabase.from("reel_likes").select("reel_id").eq("profile_id", user.id);
      setLikedIds(new Set((likes || []).map((l: any) => l.reel_id)));
    }
    setLoading(false);
  };

  useEffect(() => { if (user) fetchReels(); }, [user]);

  const toggleLike = async (reelId: string) => {
    if (!user) return;
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
          <CreateReelDialog onCreated={fetchReels} />
        </div>
      </header>

      <main className="max-w-md mx-auto py-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : reels.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No reels yet. Be the first!</p>
        ) : (
          reels.map((reel) => (
            <div key={reel.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                  <AvatarImage src={reel.profiles?.avatar_url || ""} />
                  <AvatarFallback>{reel.profiles?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold">{reel.profiles?.username}</p>
              </div>
              <div className="relative bg-black aspect-[9/16] flex items-center justify-center">
                {reel.media_type === "video" ? (
                  <video src={reel.media_url} controls loop playsInline className="w-full h-full object-contain" />
                ) : (
                  <img src={reel.media_url} alt={reel.caption || ""} className="w-full h-full object-contain animate-pulse-slow" />
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleLike(reel.id)} className="hover:scale-110 transition-transform">
                    <Heart className={`h-6 w-6 ${likedIds.has(reel.id) ? "fill-primary text-primary" : "text-foreground"}`} />
                  </button>
                  <span className="text-sm font-semibold">{reel.reel_likes?.[0]?.count || 0} likes</span>
                </div>
                {reel.caption && <p className="text-sm"><span className="font-semibold mr-2">{reel.profiles?.username}</span>{reel.caption}</p>}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

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
