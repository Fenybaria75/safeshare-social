import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/types";

export function usePosts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (*),
          comments (*, profiles (*)),
          likes (count)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Post[];
    },
  });
}
