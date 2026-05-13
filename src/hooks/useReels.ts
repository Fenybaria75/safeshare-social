import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeedReel {
  id: string;
  profile_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null };
  reel_likes: { count: number }[];
}

export function useReels() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reels")
        .select("*, profiles(*), reel_likes(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as FeedReel[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("reels-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "reels" }, () =>
        qc.invalidateQueries({ queryKey: ["reels"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return query;
}
