import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ShieldAlert, ArrowLeft, AlertTriangle, Search, Filter,
  BarChart3, User, TrendingUp, PieChart, Activity, CheckCircle2, XCircle
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
  AreaChart,
  Area,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import type { Comment } from "@/types";
import { formatDistanceToNow, format, subDays, isAfter } from "date-fns";

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
  const { user, profile: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Use ALL posts, not just user's own posts
  const allPosts = useMemo(() => posts || [], [posts]);

  const allComments = useMemo(() => {
    const comments: (Comment & { postCaption: string | null; postImage: string; postOwner: string })[] = [];
    for (const post of allPosts) {
      for (const comment of post.comments || []) {
        comments.push({
          ...comment,
          postCaption: post.caption,
          postImage: post.image_url,
          postOwner: post.profiles?.username || "unknown",
        });
      }
    }
    return comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allPosts]);

  const allFlaggedComments = useMemo(() => {
    return allComments.filter((c) => c.is_hidden);
  }, [allComments]);

  const safeComments = useMemo(() => {
    return allComments.filter((c) => !c.is_hidden);
  }, [allComments]);

  const totalComments = allComments.length;

  const filtered = allFlaggedComments.filter(
    (c) =>
      c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.hidden_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const flagRate = totalComments > 0 ? ((allFlaggedComments.length / totalComments) * 100).toFixed(1) : "0";
  const safeRate = totalComments > 0 ? (100 - parseFloat(flagRate)).toFixed(1) : "0";

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

  // Timeline data - last 7 days
  const timelineData = useMemo(() => {
    const days: { date: string; safe: number; flagged: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, "yyyy-MM-dd");
      const label = format(day, "MMM dd");
      const dayComments = allComments.filter((c) => format(new Date(c.created_at), "yyyy-MM-dd") === dayStr);
      days.push({
        date: label,
        safe: dayComments.filter((c) => !c.is_hidden).length,
        flagged: dayComments.filter((c) => c.is_hidden).length,
      });
    }
    return days;
  }, [allComments]);

  // Safety score radial
  const safetyScore = useMemo(() => {
    const score = totalComments > 0 ? Math.round(((totalComments - allFlaggedComments.length) / totalComments) * 100) : 100;
    return [{ name: "Safety", value: score, fill: score >= 80 ? "hsl(142, 71%, 45%)" : score >= 50 ? "hsl(45, 100%, 55%)" : "hsl(0, 72%, 51%)" }];
  }, [totalComments, allFlaggedComments.length]);

  // Top flagged users
  const topFlaggedUsers = useMemo(() => {
    const counts: Record<string, { username: string; avatar: string | null; count: number }> = {};
    allFlaggedComments.forEach((c) => {
      const uid = c.profile_id;
      if (!counts[uid]) {
        counts[uid] = { username: c.profiles?.username || "unknown", avatar: c.profiles?.avatar_url || null, count: 0 };
      }
      counts[uid].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [allFlaggedComments]);

  const chartConfig = {
    value: { label: "Count" },
    safe: { label: "Safe", color: "hsl(142, 71%, 45%)" },
    flagged: { label: "Flagged", color: "hsl(0, 72%, 51%)" },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
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

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-bold">{totalComments}</p>
          </div>
          <div className="bg-card rounded-xl border border-destructive/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Flagged</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{allFlaggedComments.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Safe</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{safeComments.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Flag Rate</span>
            </div>
            <p className="text-2xl font-bold">{flagRate}%</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Posts</span>
            </div>
            <p className="text-2xl font-bold">{allPosts.length}</p>
          </div>
        </div>

        {/* Row 1: Timeline + Safety Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Timeline Area Chart */}
          <div className="md:col-span-2 bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Comment Activity (Last 7 Days)</h3>
            </div>
            <ChartContainer config={chartConfig} className="h-52">
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="flaggedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="safe" stroke="hsl(142, 71%, 45%)" fill="url(#safeGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="flagged" stroke="hsl(0, 72%, 51%)" fill="url(#flaggedGradient)" strokeWidth={2} />
                <Legend />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Safety Score Radial */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Safety Score</h3>
            </div>
            <div className="relative h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={12} data={safetyScore} startAngle={90} endAngle={-270}>
                  <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{safetyScore[0].value}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Safe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Flagged vs Safe + Severity + Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Flagged vs Safe */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Flagged vs Safe</h3>
            </div>
            <ChartContainer config={chartConfig} className="h-48">
              <BarChart
                data={[
                  { name: "Safe", value: safeComments.length, fill: "hsl(142, 71%, 45%)" },
                  { name: "Flagged", value: allFlaggedComments.length, fill: "hsl(0, 72%, 51%)" },
                ]}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[{ fill: "hsl(142, 71%, 45%)" }, { fill: "hsl(0, 72%, 51%)" }].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          {/* Severity */}
          {allFlaggedComments.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
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
          )}

          {/* Category Pie */}
          {allFlaggedComments.length > 0 && (
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
                    innerRadius={35}
                    outerRadius={65}
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
          )}
        </div>

        {/* Top Flagged Users */}
        {topFlaggedUsers.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Top Flagged Users</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {topFlaggedUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar || ""} />
                    <AvatarFallback className="bg-destructive/20 text-destructive text-[10px]">
                      {u.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">@{u.username}</p>
                    <p className="text-[10px] text-destructive font-medium">{u.count} flagged</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  : "No flagged comments detected. Community is safe! 🎉"}
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
                    <p className="text-xs text-muted-foreground pl-11">
                      On <span className="font-medium">@{comment.postOwner}</span>'s post
                      {comment.postCaption && <>: "{comment.postCaption}"</>}
                    </p>
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
