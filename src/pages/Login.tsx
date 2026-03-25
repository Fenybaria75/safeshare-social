import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Instagram, LogIn, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfiles } from "@/hooks/useProfiles";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/types";

const Login = () => {
  const { data: profiles, isLoading } = useProfiles();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    // Store selected profile in sessionStorage for demo
    sessionStorage.setItem("safegram_user", JSON.stringify(selectedProfile));
    navigate("/feed");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Instagram className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">SafeGram</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            A safer social media experience powered by AI moderation
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <Shield className="h-3.5 w-3.5" />
            <span>AI-Powered Cyberbullying Detection</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-center">Sign in to your account</h2>

          {/* Profile Selection */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium">Select a profile</label>
            {isLoading ? (
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {profiles?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfile(p)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      selectedProfile?.id === p.id
                        ? "bg-primary/15 ring-2 ring-primary scale-105"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.avatar_url || ""} />
                      <AvatarFallback className="bg-muted text-[10px]">
                        {p.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                      {p.username}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Username</label>
              <Input
                value={selectedProfile?.username || ""}
                readOnly
                placeholder="Select a profile above"
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Any password (demo mode)"
                  className="bg-muted/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Demo: any password works</p>
            </div>

            <Button
              type="submit"
              disabled={!selectedProfile}
              className="w-full gradient-bg text-primary-foreground font-semibold"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          SafeGram uses AI to detect and filter cyberbullying in real-time.
          <br />
          Supports 50+ languages and emoji-based abuse detection.
        </p>
      </div>
    </div>
  );
};

export default Login;
