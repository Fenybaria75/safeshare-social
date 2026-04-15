import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, ShieldAlert, LogOut, Search, Sparkles, UserCircle } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useProfiles } from "@/hooks/useProfiles";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { CreatePostDialog } from "@/components/CreatePostDialog";

const Index = () => {
  const { data: posts, isLoading: postsLoading } = usePosts();
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { user, profile: currentUser, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isLoading = postsLoading || profilesLoading || authLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Instagram className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold gradient-text">SafeGram</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <CreatePostDialog />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/search")}>
              <Search className="h-4 w-4" />
            </Button>
            <NavLink to="/ai-chat" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-full">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span>
            </NavLink>
            <NavLink to="/moderation" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors bg-muted px-3 py-1.5 rounded-full">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mod</span>
            </NavLink>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(user ? `/profile/${user.id}` : "/profile")}>
              <UserCircle className="h-4 w-4" />
            </Button>
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
                  src={currentUser.avatar_url || "/placeholder.svg"}
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


            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <p className="text-sm font-semibold">Quick Links</p>
              <div className="space-y-1">
                <button onClick={() => navigate("/moderation")} className="w-full text-left text-xs text-muted-foreground hover:text-destructive transition-colors py-1">
                  🛡️ Moderation Dashboard
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 max-w-lg mx-auto space-y-6">
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
