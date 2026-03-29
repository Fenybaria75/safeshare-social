export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  profile_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profiles: Profile;
  comments: Comment[];
  likes: { count: number }[];
}

export interface Comment {
  id: string;
  post_id: string;
  profile_id: string;
  content: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  profiles: Profile;
}

export interface EmojiAnalysis {
  emoji: string;
  meaning: string;
  sentiment: "positive" | "negative" | "neutral" | "hostile";
}

export interface ModerationResult {
  is_harmful: boolean;
  reason: string;
  severity: "none" | "low" | "medium" | "high";
  category: "non-toxic" | "offensive" | "cyberbullying" | "hate_speech" | "threat";
  detected_language: string;
  toxic_words: string[];
  emoji_analysis: EmojiAnalysis[];
  confidence_score: number;
}
