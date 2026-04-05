import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Instagram, LogIn, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Login = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/feed");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      if (!username.trim() || !displayName.trim()) {
        toast.error("Username and display name are required");
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim(), displayName.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Signing you in...");
        // Auto sign-in after successful signup
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          toast.error("Account created but could not auto sign-in: " + signInError.message + ". Please sign in manually.");
          setIsSignUp(false);
        }
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
          <h2 className="text-lg font-semibold text-center">
            {isSignUp ? "Create an account" : "Sign in to your account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="bg-muted/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-muted/50"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-muted/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-muted/50 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gradient-bg text-primary-foreground font-semibold"
            >
              {isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {submitting ? "Creating..." : "Sign Up"}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  {submitting ? "Signing in..." : "Sign In"}
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

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
