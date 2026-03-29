import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ModerationResult } from "@/types";
import { toast } from "sonner";

export async function moderateComment(comment: string): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke("moderate-comment", {
    body: { comment },
  });
  if (error) {
    console.error("Moderation error:", error);
    return {
      is_harmful: false,
      reason: "Moderation unavailable",
      severity: "none",
      category: "non-toxic",
      detected_language: "unknown",
      toxic_words: [],
      emoji_analysis: [],
      confidence_score: 0,
    };
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
      const modResult = await moderateComment(content);

      const reasonText = modResult.is_harmful
        ? `[${modResult.category}] ${modResult.reason} (lang: ${modResult.detected_language}, score: ${modResult.confidence_score})`
        : null;

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          profile_id: profileId,
          content,
          is_hidden: modResult.is_harmful,
          hidden_reason: reasonText,
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
          description: `${result.moderation.category}: ${result.moderation.reason}`,
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to post comment");
      console.error(error);
    },
  });
}
