import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, Database, Globe, Cpu, Eye, Zap, Server,
  Layers, MessageSquare, AlertTriangle, CheckCircle, SmilePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Architecture = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem("safegram_user");
    if (!stored) navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">System Architecture</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Title */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold gradient-text">
            Multilingual Cyberbullying Detection System
          </h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            A real-time AI-powered content moderation system using MuRIL-inspired multilingual NLP pipeline
            with XLM-RoBERTa cross-lingual transfer learning and emoji sentiment analysis.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline">MuRIL</Badge>
            <Badge variant="outline">XLM-RoBERTa</Badge>
            <Badge variant="outline">Google Gemini</Badge>
            <Badge variant="outline">Supabase</Badge>
            <Badge variant="outline">React + TypeScript</Badge>
          </div>
        </div>

        {/* High-Level Architecture */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            High-Level System Architecture
          </h3>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Frontend */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-sm">Frontend (React)</h4>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Login & Profile Selection</li>
                  <li>• Instagram-style Feed</li>
                  <li>• Real-time Comment Input</li>
                  <li>• Live Detection Testing</li>
                  <li>• Moderation Dashboard</li>
                  <li>• Toxic Word Highlighting</li>
                  <li>• Emoji Sentiment Display</li>
                </ul>
              </div>

              {/* Backend */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-accent/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  <h4 className="font-semibold text-sm">Backend (Edge Functions)</h4>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Supabase Edge Function</li>
                  <li>• moderate-comment API</li>
                  <li>• AI Gateway Integration</li>
                  <li>• CORS & Rate Limiting</li>
                  <li>• Input Validation (1000 char)</li>
                  <li>• Error Handling (429/402)</li>
                </ul>
              </div>

              {/* AI/Database */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-secondary/20">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-secondary" />
                  <h4 className="font-semibold text-sm">AI & Database</h4>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Google Gemini 3 Flash</li>
                  <li>• MuRIL Pipeline Prompt</li>
                  <li>• Tool Calling (Structured)</li>
                  <li>• Supabase PostgreSQL</li>
                  <li>• profiles, posts, comments</li>
                  <li>• RLS Policies</li>
                </ul>
              </div>
            </div>

            {/* Flow Arrows */}
            <div className="mt-6 bg-muted/30 rounded-lg p-4">
              <p className="text-xs text-muted-foreground text-center font-mono">
                User Input → React Frontend → Supabase Edge Function → Lovable AI Gateway → Google Gemini (MuRIL Prompt) → Structured JSON Response → Store in DB → Display Result
              </p>
            </div>
          </div>
        </section>

        {/* MuRIL Pipeline */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            MuRIL + XLM-RoBERTa Detection Pipeline
          </h3>
          <div className="space-y-3">
            {[
              {
                stage: 1,
                title: "Text Preprocessing & Normalization",
                icon: <Zap className="h-5 w-5" />,
                color: "border-primary/30",
                details: [
                  "Unicode NFC normalization for mixed-script text (Devanagari, Latin, Arabic, CJK)",
                  "Leetspeak decoding: h8→hate, f4g→slur, r3tard→slur",
                  "Spacing trick reversal: 's t u p i d' → 'stupid'",
                  "Symbol substitution: @$$→ass, $hit→profanity, b!tch→slur",
                  "Homoglyph normalization: Cyrillic а → Latin a",
                ],
              },
              {
                stage: 2,
                title: "Multilingual Tokenization (MuRIL-style)",
                icon: <Globe className="h-5 w-5" />,
                color: "border-accent/30",
                details: [
                  "Subword tokenization for 17+ Indian languages + transliterated variants",
                  "Code-switching detection across language boundaries within comments",
                  "Indo-Aryan: Hindi, Urdu, Bengali, Marathi, Gujarati, Punjabi, Nepali",
                  "Dravidian: Tamil, Telugu, Kannada, Malayalam",
                  "Transliterated forms: Hinglish, Romanized Arabic (Arabizi)",
                ],
              },
              {
                stage: 3,
                title: "XLM-RoBERTa Semantic Embedding Analysis",
                icon: <Cpu className="h-5 w-5" />,
                color: "border-secondary/30",
                details: [
                  "Cross-lingual contextual embeddings for meaning understanding",
                  "Similarity scoring against known toxic/abusive pattern clusters",
                  "Context distinction: 'You killed it! 🔥' (positive) vs 'I'll kill you' (threat)",
                  "Sarcasm detection: 'wow you're SO smart 🙄' (passive-aggressive bullying)",
                  "Cross-lingual transfer: toxic patterns learned in one language apply to others",
                ],
              },
              {
                stage: 4,
                title: "Emoji Sentiment Classification",
                icon: <SmilePlus className="h-5 w-5" />,
                color: "border-amber-500/30",
                details: [
                  "Emoji toxicity lexicon: 🤮💀🖕🤡 (hostile), 🔫🗡️💣 (threats)",
                  "Contextual body shaming: 🐷🐖 when directed at someone",
                  "Emoji-only message abuse detection (pure emoji bullying)",
                  "Each emoji mapped to textual meaning + sentiment (positive/negative/neutral/hostile)",
                  "Cultural context awareness: emoji meaning varies by region",
                ],
              },
              {
                stage: 5,
                title: "Toxicity Classification & Scoring",
                icon: <AlertTriangle className="h-5 w-5" />,
                color: "border-destructive/30",
                details: [
                  "Categories: non-toxic, offensive, cyberbullying, hate_speech, threat",
                  "Severity: none (<0.3), low (0.3-0.5), medium (0.5-0.7), high (>0.7)",
                  "Confidence score: 0.0 (safe) to 1.0 (highly toxic)",
                  "Auto-hide: comments with severity 'medium' or 'high' are hidden automatically",
                  "Flagged for review: all hidden comments logged with full analysis metadata",
                ],
              },
            ].map((s) => (
              <div key={s.stage} className={`bg-card rounded-xl border ${s.color} p-4`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full gradient-bg text-primary-foreground font-bold flex items-center justify-center shrink-0">
                    {s.stage}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {s.icon}
                      <h4 className="font-semibold">{s.title}</h4>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {s.details.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Database Schema */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Database Schema (PostgreSQL / Supabase)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                table: "profiles",
                cols: ["id (uuid, PK)", "username (text, unique)", "display_name (text)", "avatar_url (text)", "bio (text)", "created_at (timestamptz)"],
              },
              {
                table: "posts",
                cols: ["id (uuid, PK)", "profile_id (uuid, FK→profiles)", "image_url (text)", "caption (text)", "created_at (timestamptz)"],
              },
              {
                table: "comments",
                cols: ["id (uuid, PK)", "post_id (uuid, FK→posts)", "profile_id (uuid, FK→profiles)", "content (text)", "is_hidden (boolean)", "hidden_reason (text)", "created_at (timestamptz)"],
              },
              {
                table: "likes",
                cols: ["id (uuid, PK)", "post_id (uuid, FK→posts)", "profile_id (uuid, FK→profiles)", "created_at (timestamptz)"],
              },
            ].map((t) => (
              <div key={t.table} className="bg-card rounded-xl border border-border p-4 space-y-2">
                <h4 className="font-semibold text-sm text-primary font-mono">{t.table}</h4>
                <ul className="text-xs text-muted-foreground space-y-0.5 font-mono">
                  {t.cols.map((c, i) => (
                    <li key={i} className="pl-2 border-l border-border">{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Classification Output */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            API Response Schema
          </h3>
          <div className="bg-card rounded-xl border border-border p-4">
            <pre className="text-xs text-muted-foreground overflow-x-auto font-mono leading-relaxed">
{`POST /functions/v1/moderate-comment
Body: { "comment": "string (max 1000 chars)" }

Response: {
  "is_harmful": boolean,
  "reason": "Classification reason",
  "severity": "none" | "low" | "medium" | "high",
  "category": "non-toxic" | "offensive" | "cyberbullying" 
             | "hate_speech" | "threat",
  "detected_language": "English" | "Hindi" | "Hinglish" | ...,
  "toxic_words": ["word1", "word2"],
  "emoji_analysis": [
    {
      "emoji": "🖕",
      "meaning": "middle finger gesture",
      "sentiment": "hostile"
    }
  ],
  "confidence_score": 0.0 - 1.0
}`}
            </pre>
          </div>
        </section>

        {/* Evaluation Metrics */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Evaluation Metrics & Research Context
          </h3>
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This system is designed following the methodology described in:
            </p>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">MuRIL (Khanuja et al., 2021)</strong> — Multilingual Representations for Indian Languages,
                pre-trained on 17 Indian languages with transliteration support.
              </li>
              <li>
                <strong className="text-foreground">XLM-RoBERTa (Conneau et al., 2020)</strong> — Cross-lingual Language Model pre-trained on
                100 languages, enabling zero-shot cross-lingual transfer for toxicity detection.
              </li>
              <li>
                <strong className="text-foreground">Emoji Sentiment Ranking (Novak et al., 2015)</strong> — Emoji sentiment lexicon
                used for classifying emoji-based sentiment contributions.
              </li>
            </ul>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { metric: "Accuracy", desc: "Overall correct predictions" },
                { metric: "Precision", desc: "True positives / predicted positives" },
                { metric: "Recall", desc: "True positives / actual positives" },
                { metric: "F1-Score", desc: "Harmonic mean of P & R" },
              ].map((m) => (
                <div key={m.metric} className="bg-muted/50 rounded-lg p-3 text-center space-y-1">
                  <p className="text-sm font-bold text-primary">{m.metric}</p>
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Architecture;
