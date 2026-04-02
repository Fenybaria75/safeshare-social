import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ShieldAlert, ArrowLeft, AlertTriangle, Search, Filter,
  BarChart3, User, TrendingUp, PieChart
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart as RPieChart,
  Pie,
} from "recharts";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import type { Comment } from "@/types";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  offensive: "hsl(45, 100%, 55%)",
  cyberbullying: "hsl(25, 90%, 55%)",
  hate_speech: "hsl(0, 72%, 51%)",
  threat: "hsl(0, 60%, 40%)",
  unknown: "hsl(0, 0%, 50%)",
};

function extractCategory(reason: string | null): string {
  if (!reason) return "unknown";
  const match = reason.match(/^\[([^\]]+)\]/);
  if (match) return match[1];
  const lower = reason.toLowerCase();
  if (lower.includes("threat")) return "threat";
  if (lower.includes("hate")) return "hate_speech";
  if (lower.includes("bully")) return "cyberbullying";
  if (lower.includes("offensive") || lower.includes("insult") || lower.includes("profanity")) return "offensive";
  return "unknown";
}

function extractSeverity(reason: string | null): string {
  if (!reason) return "unknown";
  const match = reason.match(/score:\s*([\d.]+)/);
  if (match) {
    const score = parseFloat(match[1]);
    if (score >= 0.7) return "high";
    if (score >= 0.5) return "medium";
    if (score >= 0.3) return "low";
    return "none";
  }
  return "medium";
}

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

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allFlaggedComments.forEach((c) => {
      const cat = extractCategory(c.hidden_reason);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace("_", " "),
      value,
      fill: CATEGORY_COLORS[name] || CATEGORY_COLORS.unknown,
    }));
  }, [allFlaggedComments]);

  // Severity breakdown for bar chart
  const severityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0 };
    allFlaggedComments.forEach((c) => {
      const sev = extractSeverity(c.hidden_reason);
      if (counts[sev] !== undefined) counts[sev]++;
      else counts.medium++;
    });
    return [
      { name: "Low", value: counts.low, fill: "hsl(45, 100%, 55%)" },
      { name: "Medium", value: counts.medium, fill: "hsl(25, 90%, 55%)" },
      { name: "High", value: counts.high, fill: "hsl(0, 72%, 51%)" },
    ];
  }, [allFlaggedComments]);

  const chartConfig = {
    value: { label: "Count" },
  };

  return (
    <div className="min-h-screen bg-background">
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Total Comments</span>
            </div>
            <p className="text-2xl font-bold">{totalComments}</p>
          </div>
          <div className="bg-card rounded-xl border border-destructive/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Flagged</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{allFlaggedComments.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Safe Comments</span>
            </div>
            <p className="text-2xl font-bold">{totalComments - allFlaggedComments.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Flag Rate</span>
            </div>
            <p className="text-2xl font-bold">{flagRate}%</p>
          </div>
        </div>

        {/* Charts */}
        {allFlaggedComments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity Chart */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Severity Distribution</h3>
              </div>
              <ChartContainer config={chartConfig} className="h-48">
                <BarChart data={severityBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            {/* Category Chart */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Category Breakdown</h3>
              </div>
              <ChartContainer config={chartConfig} className="h-48">
                <RPieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RPieChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* MuRIL info */}
        <div className="bg-card rounded-xl border border-primary/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">MuRIL + XLM-RoBERTa Detection Pipeline</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Comments are processed through a 5-stage pipeline: <strong>Text Preprocessing</strong> (normalization, leetspeak decoding),{" "}
            <strong>MuRIL Tokenization</strong> (17+ Indian languages), <strong>XLM-RoBERTa Embeddings</strong> (cross-lingual semantic analysis),{" "}
            <strong>Emoji Sentiment Classification</strong> (toxicity lexicon), and <strong>Toxicity Scoring</strong> (multi-category classification with confidence scores).
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flagged comments..."
            className="pl-10 bg-card"
          />
        </div>

        {/* Flagged comments list */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground">
              {filtered.length} Flagged Comment{filtered.length !== 1 ? "s" : ""}
            </h2>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
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
            filtered.map((comment) => {
              const cat = extractCategory(comment.hidden_reason);
              return (
                <div
                  key={comment.id}
                  className="bg-card rounded-xl border-2 border-destructive/40 overflow-hidden"
                >
                  <div className="bg-destructive/10 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-xs font-bold text-destructive uppercase tracking-wide">
                        {cat.replace("_", " ")}
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
                        <p className="text-sm text-foreground bg-destructive/5 rounded-lg p-2 border border-destructive/20 line-through">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    {comment.hidden_reason && (
                      <div className="flex items-center gap-2 pl-11 flex-wrap">
                        <Badge variant="destructive" className="text-xs px-2.5 py-0.5">
                          AI: {comment.hidden_reason}
                        </Badge>
                      </div>
                    )}
                    {comment.postCaption && (
                      <p className="text-xs text-muted-foreground pl-11">
                        On post: "{comment.postCaption}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderation;
