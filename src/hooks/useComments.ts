import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ModerationResult } from "@/types";
import { toast } from "sonner";

async function moderateComment(comment: string): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke("moderate-comment", {
    body: { comment },
  });
  if (error) {
    console.error("Moderation error:", error);
    return { is_harmful: false, reason: "Moderation unavailable", severity: "none" };
  }
  return data as ModerationResult;
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      profileId,
      content,
    }: {
      postId: string;
      profileId: string;
      content: string;
    }) => {
      // Step 1: AI moderation
      const modResult = await moderateComment(content);

      // Step 2: Insert comment (hidden if harmful)
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          profile_id: profileId,
          content,
          is_hidden: modResult.is_harmful,
          hidden_reason: modResult.is_harmful ? modResult.reason : null,
        })
        .select("*, profiles (*)")
        .single();

      if (error) throw error;

      return { comment: data, moderation: modResult };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (result.moderation.is_harmful) {
        toast.error("Comment hidden by AI moderation", {
          description: result.moderation.reason,
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to post comment");
      console.error(error);
    },
  });
}
