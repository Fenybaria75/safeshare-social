import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useLikedPostIds(userId: string | undefined) {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setLiked(new Set());
      return;
    }
    supabase
      .from("likes")
      .select("post_id")
      .eq("profile_id", userId)
      .then(({ data }) => {
        setLiked(new Set((data || []).map((r: any) => r.post_id)));
      });
  }, [userId]);

  return { liked, setLiked };
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("profile_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, profile_id: user.id });
        if (error) throw error;
      }
      return { postId, isLiked: !isLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to like"),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });
}
