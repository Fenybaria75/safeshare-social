import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Users, Image } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { usePosts } from "@/hooks/usePosts";

const SearchPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profiles } = useProfiles();
  const { data: posts } = usePosts();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [user, authLoading, navigate]);

  const filteredProfiles = useMemo(() => {
    if (!query.trim() || !profiles) return profiles || [];
    const q = query.toLowerCase();
    return profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.display_name.toLowerCase().includes(q)
    );
  }, [profiles, query]);

  const filteredPosts = useMemo(() => {
    if (!query.trim() || !posts) return posts || [];
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.caption?.toLowerCase().includes(q) ||
        p.profiles?.username?.toLowerCase().includes(q)
    );
  }, [posts, query]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users and posts..."
              className="pl-9 bg-muted/50"
              autoFocus
            />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <Tabs defaultValue="users">
          <TabsList className="w-full">
            <TabsTrigger value="users" className="flex-1 gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Users ({filteredProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex-1 gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Posts ({filteredPosts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 space-y-2">
            {filteredProfiles.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
            ) : (
              filteredProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/profile/${p.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-border">
                    <AvatarImage src={p.avatar_url || ""} />
                    <AvatarFallback className="bg-muted text-xs">
                      {p.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold truncate">{p.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                  </div>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-4">
            {filteredPosts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No posts found</p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm">
                    <img src={post.image_url} alt={post.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-xs font-medium text-center px-2 line-clamp-3">{post.caption || "No caption"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SearchPage;
