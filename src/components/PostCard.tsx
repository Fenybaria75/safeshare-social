import { useState } from "react";
import { Heart, MessageCircle, Shield, ShieldAlert, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Post, Profile, Comment } from "@/types";
import { useAddComment } from "@/hooks/useComments";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
  currentUser: Profile;
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const addComment = useAddComment();

  const visibleComments = post.comments?.filter((c) => !c.is_hidden) || [];
  const hiddenComments = post.comments?.filter((c) => c.is_hidden) || [];
  const likeCount = post.likes?.[0]?.count || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate(
      { postId: post.id, profileId: currentUser.id, content: commentText.trim() },
      { onSuccess: () => setCommentText("") }
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar className="h-9 w-9 ring-2 ring-primary/30">
          <AvatarImage src={post.profiles.avatar_url || ""} />
          <AvatarFallback className="bg-muted text-xs">
            {post.profiles.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{post.profiles.username}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <img
          src={post.image_url}
          alt={post.caption || "Post"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button className="hover:scale-110 transition-transform">
            <Heart className="h-6 w-6 text-foreground hover:text-primary transition-colors" />
          </button>
          <button
            className="hover:scale-110 transition-transform"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-6 w-6 text-foreground hover:text-accent transition-colors" />
          </button>
          {hiddenComments.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="text-xs text-destructive font-medium">
                {hiddenComments.length} flagged
              </span>
            </div>
          )}
        </div>

        <p className="text-sm font-semibold">{likeCount} likes</p>

        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{post.profiles.username}</span>
            {post.caption}
          </p>
        )}

        {/* Comments toggle */}
        {post.comments?.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showComments ? "Hide" : "View"} {visibleComments.length} comment{visibleComments.length !== 1 ? "s" : ""}
          </button>
        )}

        {/* Comments */}
        {showComments && (
          <div className="space-y-2 pt-1">
            {visibleComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}

            {hiddenComments.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className="flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive transition-colors"
                >
                  <Shield className="h-3 w-3" />
                  {showHidden ? "Hide" : "Show"} {hiddenComments.length} hidden comment{hiddenComments.length !== 1 ? "s" : ""}
                </button>
                {showHidden && (
                  <div className="space-y-2 mt-2">
                    {hiddenComments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} isHidden />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add comment */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-border">
          <Avatar className="h-7 w-7">
            <AvatarImage src={currentUser.avatar_url || ""} />
            <AvatarFallback className="bg-muted text-[10px]">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border-0 bg-transparent text-sm h-8 focus-visible:ring-0 px-1"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={!commentText.trim() || addComment.isPending}
            className="text-primary font-semibold text-sm hover:text-primary/80 disabled:opacity-30"
          >
            {addComment.isPending ? "..." : "Post"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function CommentItem({ comment, isHidden }: { comment: Comment; isHidden?: boolean }) {
  if (isHidden) {
    return (
      <div className="border-2 border-destructive rounded-lg bg-destructive/10 p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-xs font-bold text-destructive uppercase tracking-wide">
            Flagged by AI Moderation
          </span>
        </div>
        <div className="flex gap-2 text-sm">
          <Avatar className="h-6 w-6 mt-0.5 shrink-0">
            <AvatarImage src={comment.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-muted text-[9px]">
              {comment.profiles?.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p>
              <span className="font-semibold mr-1.5 text-destructive">{comment.profiles?.username}</span>
              <span className="italic text-destructive/70 line-through">{comment.content}</span>
            </p>
            {comment.hidden_reason && (
              <div className="flex items-center gap-1 mt-1.5">
                <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-semibold">
                  Reason: {comment.hidden_reason}
                </Badge>
              </div>
            )}
            <p className="text-xs text-destructive/50 mt-1">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-sm">
      <Avatar className="h-6 w-6 mt-0.5 shrink-0">
        <AvatarImage src={comment.profiles?.avatar_url || ""} />
        <AvatarFallback className="bg-muted text-[9px]">
          {comment.profiles?.username?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p>
          <span className="font-semibold mr-1.5">{comment.profiles?.username}</span>
          {comment.content}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
