import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Film, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { FeedReel } from "@/hooks/useReels";
import type { Profile } from "@/types";
import { toast } from "sonner";

export function ReelFeedCard({ reel, currentUser }: { reel: FeedReel; currentUser: Profile }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(reel.reel_likes?.[0]?.count || 0);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isOwner = currentUser.id === reel.profile_id;

  useEffect(() => {
    supabase.from("reel_likes").select("id").eq("reel_id", reel.id).eq("profile_id", currentUser.id)
      .maybeSingle().then(({ data }) => setLiked(!!data));
  }, [reel.id, currentUser.id]);

  const toggle = async () => {
    if (liked) {
      setLiked(false); setCount((c) => Math.max(0, c - 1));
      await supabase.from("reel_likes").delete().eq("reel_id", reel.id).eq("profile_id", currentUser.id);
    } else {
      setLiked(true); setCount((c) => c + 1);
      await supabase.from("reel_likes").insert({ reel_id: reel.id, profile_id: currentUser.id });
    }
    qc.invalidateQueries({ queryKey: ["reels"] });
  };

  const onDelete = async () => {
    if (!confirm("Delete this reel?")) return;
    const { error } = await supabase.from("reels").delete().eq("id", reel.id);
    if (error) return toast.error(error.message);
    toast.success("Reel deleted");
    qc.invalidateQueries({ queryKey: ["reels"] });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-9 w-9 ring-2 ring-primary/30">
          <AvatarImage src={reel.profiles?.avatar_url || ""} />
          <AvatarFallback className="bg-muted text-xs">
            {reel.profiles?.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            {reel.profiles?.username}
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              <Film className="h-3 w-3" /> Reel
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
          </p>
        </div>
        {isOwner && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <button onClick={() => navigate("/reels")} className="block w-full bg-black aspect-[4/5] relative">
        {reel.media_type === "video" ? (
          <video src={reel.media_url} muted loop playsInline autoPlay className="w-full h-full object-contain" />
        ) : (
          <img src={reel.media_url} alt={reel.caption || ""} className="w-full h-full object-contain" />
        )}
        <span className="absolute top-2 right-2 bg-background/70 backdrop-blur px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
          <Film className="h-3 w-3 text-primary" /> Reel
        </span>
      </button>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="hover:scale-110 transition-transform">
            <Heart className={`h-6 w-6 ${liked ? "fill-primary text-primary" : "text-foreground hover:text-primary"}`} />
          </button>
          <Button variant="link" size="sm" className="ml-auto text-xs px-0" onClick={() => navigate("/reels")}>
            Open in Reels →
          </Button>
        </div>
        <p className="text-sm font-semibold">{count} likes</p>
        {reel.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{reel.profiles?.username}</span>{reel.caption}
          </p>
        )}
      </div>
    </div>
  );
}
