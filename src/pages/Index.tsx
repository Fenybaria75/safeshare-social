import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Instagram, ShieldAlert, LogOut, Zap, Layers } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useProfiles } from "@/hooks/useProfiles";
import { PostCard } from "@/components/PostCard";
import { UserSwitcher } from "@/components/UserSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import type { Profile } from "@/types";

const Index = () => {
  const { data: posts, isLoading: postsLoading } = usePosts();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem("safegram_user");
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    } else if (profiles && profiles.length > 0) {
      setCurrentUser(profiles[0]);
    }
  }, [profiles]);

  const handleLogout = () => {
    sessionStorage.removeItem("safegram_user");
    navigate("/");
  };

  const handleSwitchUser = (profile: Profile) => {
    setCurrentUser(profile);
    sessionStorage.setItem("safegram_user", JSON.stringify(profile));
  };

  const isLoading = postsLoading || profilesLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Instagram className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold gradient-text">SafeGram</h1>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/test" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-full">
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Test</span>
            </NavLink>
            <NavLink to="/moderation" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors bg-muted px-3 py-1.5 rounded-full">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Moderation</span>
            </NavLink>
            <NavLink to="/architecture" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors bg-muted px-3 py-1.5 rounded-full">
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Architecture</span>
            </NavLink>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">AI Active</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-8">
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-20 space-y-6">
            {currentUser && (
              <div className="bg-card rounded-xl border border-border p-4 text-center space-y-2">
                <img
                  src={currentUser.avatar_url || ""}
                  alt={currentUser.username}
                  className="w-16 h-16 rounded-full mx-auto ring-2 ring-primary/30 object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{currentUser.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
                </div>
                {currentUser.bio && (
                  <p className="text-xs text-muted-foreground">{currentUser.bio}</p>
                )}
              </div>
            )}

            {profiles && currentUser && (
              <div className="bg-card rounded-xl border border-border p-4">
                <UserSwitcher profiles={profiles} currentUser={currentUser} onSwitch={handleSwitchUser} />
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">AI Moderation</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                MuRIL + XLM-RoBERTa pipeline detects cyberbullying, hate speech, threats across 50+ languages with emoji sentiment analysis.
              </p>
            </div>

            {/* Quick nav */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <p className="text-sm font-semibold">Quick Links</p>
              <div className="space-y-1">
                <button onClick={() => navigate("/test")} className="w-full text-left text-xs text-muted-foreground hover:text-primary transition-colors py-1">
                  🧪 Live Detection Test
                </button>
                <button onClick={() => navigate("/moderation")} className="w-full text-left text-xs text-muted-foreground hover:text-destructive transition-colors py-1">
                  🛡️ Moderation Dashboard
                </button>
                <button onClick={() => navigate("/architecture")} className="w-full text-left text-xs text-muted-foreground hover:text-accent transition-colors py-1">
                  📐 System Architecture
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 max-w-lg mx-auto space-y-6">
          {profiles && currentUser && (
            <div className="md:hidden bg-card rounded-xl border border-border p-3">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchUser(p)}
                    className={`flex flex-col items-center gap-1 shrink-0 ${
                      p.id === currentUser.id ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <img
                      src={p.avatar_url || ""}
                      alt={p.username}
                      className={`w-12 h-12 rounded-full object-cover ring-2 ${
                        p.id === currentUser.id ? "ring-primary" : "ring-border"
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground truncate w-14 text-center">
                      {p.username}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))
          ) : (
            posts?.map((post) =>
              currentUser ? <PostCard key={post.id} post={post} currentUser={currentUser} /> : null
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
