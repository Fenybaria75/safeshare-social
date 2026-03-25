import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/types";

export function usePosts() {
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
