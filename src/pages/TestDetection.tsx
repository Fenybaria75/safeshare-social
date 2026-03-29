import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ArrowLeft, Zap, Globe, AlertTriangle, CheckCircle,
  SmilePlus, Type, BarChart3, Send, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { moderateComment } from "@/hooks/useComments";
import type { ModerationResult, EmojiAnalysis } from "@/types";

const SAMPLE_TEXTS = [
  { label: "Safe (English)", text: "Great photo! You look amazing 😊" },
  { label: "Offensive (English)", text: "You're so stupid and ugly, nobody likes you" },
  { label: "Hinglish Abuse", text: "Tu bahut ganda hai, tere jaisa koi nahi 🤮" },
  { label: "Hindi Hate", text: "तू बहुत बेकार है, तेरी शक्ल देखने लायक नहीं" },
  { label: "Emoji Attack", text: "🖕🤡💀🐷🐷🐷" },
  { label: "Disguised Text", text: "u r s0 stup!d and f@t lol" },
  { label: "Sarcasm", text: "Wow you're SO smart 🙄 must be nice being this dumb" },
  { label: "Threat", text: "I know where you live, watch your back 🔫" },
];

const severityColors: Record<string, string> = {
  none: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  low: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
};

const categoryColors: Record<string, string> = {
  "non-toxic": "bg-emerald-500/20 text-emerald-400",
  offensive: "bg-amber-500/20 text-amber-400",
  cyberbullying: "bg-orange-500/20 text-orange-400",
  hate_speech: "bg-destructive/20 text-destructive",
  threat: "bg-red-900/30 text-red-400",
};

const emojiSentimentColors: Record<string, string> = {
  positive: "bg-emerald-500/20 text-emerald-400",
  negative: "bg-amber-500/20 text-amber-400",
  neutral: "bg-muted text-muted-foreground",
  hostile: "bg-destructive/20 text-destructive",
};

const TestDetection = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("safegram_user");
    if (!stored) navigate("/");
  }, [navigate]);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await moderateComment(text.trim());
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const highlightToxicWords = (content: string, toxicWords: string[]) => {
    if (!toxicWords.length) return <span>{content}</span>;
    const escaped = toxicWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = content.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          toxicWords.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
            <mark key={i} className="bg-destructive/30 text-destructive px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
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
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Live Detection Test</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            MuRIL + XLM-RoBERTa + Gemini
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Pipeline Info */}
        <div className="bg-card rounded-xl border border-primary/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">MuRIL-Inspired Detection Pipeline</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              { step: "1", label: "Text Preprocessing", desc: "Normalization & deobfuscation" },
              { step: "2", label: "Tokenization", desc: "MuRIL multilingual subword" },
              { step: "3", label: "Embeddings", desc: "XLM-RoBERTa cross-lingual" },
              { step: "4", label: "Emoji Analysis", desc: "Sentiment classification" },
              { step: "5", label: "Classification", desc: "Toxicity scoring" },
            ].map((s) => (
              <div key={s.step} className="bg-muted/50 rounded-lg p-3 text-center space-y-1">
                <div className="w-6 h-6 rounded-full gradient-bg text-primary-foreground text-xs font-bold flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <p className="text-xs font-semibold">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Texts */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Quick Test Samples:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TEXTS.map((s) => (
              <button
                key={s.label}
                onClick={() => { setText(s.text); setResult(null); }}
                className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste a message to analyze for cyberbullying, hate speech, threats, or toxic content..."
            rows={4}
            className="bg-muted/50 resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length}/1000</span>
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing}
              className="gradient-bg text-primary-foreground font-semibold"
            >
              {isAnalyzing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Analyze Text</>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* Verdict */}
            <div className={`rounded-xl border-2 p-5 space-y-4 ${
              result.is_harmful
                ? "border-destructive/50 bg-destructive/5"
                : "border-emerald-500/30 bg-emerald-500/5"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.is_harmful ? (
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold">
                      {result.is_harmful ? "HARMFUL CONTENT DETECTED" : "SAFE CONTENT"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{result.reason}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={`${categoryColors[result.category] || ""} border-0`}>
                    {result.category?.replace("_", " ")}
                  </Badge>
                  <Badge className={`${severityColors[result.severity] || ""} border ml-2`}>
                    {result.severity}
                  </Badge>
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className="font-bold">{(result.confidence_score * 100).toFixed(1)}%</span>
                </div>
                <Progress value={result.confidence_score * 100} className="h-2" />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language Detection */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent" />
                  <h4 className="text-sm font-semibold">Language Detected</h4>
                </div>
                <p className="text-lg font-bold text-accent">{result.detected_language}</p>
              </div>

              {/* Toxic Words */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-destructive" />
                  <h4 className="text-sm font-semibold">Toxic Words Detected</h4>
                </div>
                {result.toxic_words?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.toxic_words.map((w, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {w}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No toxic words found</p>
                )}
              </div>
            </div>

            {/* Highlighted Text */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Highlighted Analysis</h4>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed">
                {highlightToxicWords(text, result.toxic_words || [])}
              </div>
            </div>

            {/* Emoji Analysis */}
            {result.emoji_analysis?.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <SmilePlus className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Emoji Sentiment Analysis</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.emoji_analysis.map((ea: EmojiAnalysis, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <span className="text-2xl">{ea.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ea.meaning}</p>
                        <Badge className={`${emojiSentimentColors[ea.sentiment] || ""} text-[10px] border-0 mt-0.5`}>
                          {ea.sentiment}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDetection;
