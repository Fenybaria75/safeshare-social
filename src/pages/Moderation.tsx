import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldAlert, ArrowLeft, AlertTriangle, Search, Filter, BarChart3, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/usePosts";
import type { Comment, Profile } from "@/types";
import { formatDistanceToNow } from "date-fns";

const Moderation = () => {
  const { data: posts, isLoading } = usePosts();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("safegram_user");
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Filter posts belonging to the current user
  const userPosts = useMemo(() => {
    if (!posts || !currentUser) return [];
    return posts.filter((p) => p.profile_id === currentUser.id);
  }, [posts, currentUser]);

  const allFlaggedComments = useMemo(() => {
    const flagged: (Comment & { postCaption: string | null; postImage: string })[] = [];
    for (const post of userPosts) {
      for (const comment of post.comments || []) {
        if (comment.is_hidden) {
          flagged.push({ ...comment, postCaption: post.caption, postImage: post.image_url });
        }
      }
    }
    return flagged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [userPosts]);

  const totalComments = useMemo(() => {
    return userPosts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
  }, [userPosts]);

  const filtered = allFlaggedComments.filter(
    (c) =>
      c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.hidden_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const flagRate = totalComments > 0 ? ((allFlaggedComments.length / totalComments) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <h1 className="text-lg font-bold">Moderation Dashboard</h1>
            </div>
          </div>
          {currentUser && (
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentUser.avatar_url || ""} />
                <AvatarFallback className="text-[8px] bg-primary/20">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">@{currentUser.username}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Current user info */}
        {currentUser && (
          <div className="bg-card rounded-xl border border-primary/20 p-4 flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/30">
              <AvatarImage src={currentUser.avatar_url || ""} />
              <AvatarFallback className="bg-primary/20 text-sm">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{currentUser.display_name}</p>
              <p className="text-xs text-muted-foreground">
                Showing moderation data for your {userPosts.length} post{userPosts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                MuRIL + Gemini AI
              </Badge>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Comments on Your Posts</span>
            </div>
            <p className="text-2xl font-bold">{totalComments}</p>
          </div>
          <div className="bg-card rounded-xl border border-destructive/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Flagged Comments</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{allFlaggedComments.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Flag Rate</span>
            </div>
            <p className="text-2xl font-bold">{flagRate}%</p>
          </div>
        </div>

        {/* MuRIL info */}
        <div className="bg-card rounded-xl border border-primary/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">MuRIL-Inspired Detection Pipeline</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Comments are processed through a MuRIL (Multilingual Representations for Indian Languages) inspired pipeline
            running on Google Gemini. The system performs <strong>tokenization</strong>, <strong>semantic embedding analysis</strong>,
            <strong>cross-lingual transfer learning</strong> for 50+ languages, <strong>emoji sentiment classification</strong>,
            and <strong>disguised text normalization</strong> (leetspeak, homoglyphs, spacing tricks) before final toxicity classification.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flagged comments by user, content, or reason..."
            className="pl-10 bg-card"
          />
        </div>

        {/* Flagged comments list */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground">
              {filtered.length} Flagged Comment{filtered.length !== 1 ? "s" : ""} on Your Posts
            </h2>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center space-y-2">
              <Shield className="h-10 w-10 text-primary mx-auto" />
              <p className="text-muted-foreground text-sm">
                {searchTerm
                  ? "No flagged comments match your search."
                  : "No flagged comments on your posts. Your community is safe! 🎉"}
              </p>
            </div>
          ) : (
            filtered.map((comment) => (
              <div
                key={comment.id}
                className="bg-card rounded-xl border-2 border-destructive/40 overflow-hidden"
              >
                <div className="bg-destructive/10 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-bold text-destructive uppercase tracking-wide">
                      Flagged Content
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || ""} />
                      <AvatarFallback className="bg-muted text-[10px]">
                        {comment.profiles?.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-destructive">
                        @{comment.profiles?.username}
                      </p>
                      <p className="text-sm text-foreground bg-destructive/5 rounded-lg p-2 border border-destructive/20">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                  {comment.hidden_reason && (
                    <div className="flex items-center gap-2 pl-11">
                      <Badge variant="destructive" className="text-xs px-2.5 py-0.5">
                        MuRIL Detection: {comment.hidden_reason}
                      </Badge>
                    </div>
                  )}
                  {comment.postCaption && (
                    <p className="text-xs text-muted-foreground pl-11">
                      On your post: "{comment.postCaption}"
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderation;
