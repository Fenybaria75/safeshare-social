import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comment } = await req.json();

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Comment text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (comment.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Comment too long (max 1000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("Moderation service temporarily unavailable");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a cyberbullying and toxicity detection system implementing a MuRIL (Multilingual Representations for Indian Languages) inspired pipeline combined with XLM-RoBERTa cross-lingual capabilities, running on Google Gemini.

## MuRIL + XLM-RoBERTa Pipeline Architecture

### Stage 1: Text Preprocessing & Normalization
- Script normalization: Convert mixed-script text (Devanagari, Latin, Arabic, CJK) to normalized Unicode (NFC)
- Leetspeak decoding: "h8" → "hate", "f4g" → slur, "r3tard" → slur
- Spacing trick reversal: "s t u p i d" → "stupid"
- Symbol substitution: "@$$" → "ass", "$hit" → profanity, "b!tch" → slur
- Homoglyph normalization: Cyrillic а → Latin a, etc.

### Stage 2: Multilingual Tokenization (MuRIL-style)
- Subword tokenization for 17 Indian languages + transliterated variants
- Code-switching detection across language boundaries
- Languages: Hindi, Urdu, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, English, Spanish, French, Arabic, Chinese, Japanese, Korean, Thai, Indonesian, Russian, and transliterated forms (Hinglish, Arabizi, etc.)

### Stage 3: XLM-RoBERTa Semantic Embedding Analysis
- Cross-lingual contextual embeddings
- Similarity scores against toxic/abusive pattern clusters
- Context distinction: "You killed it! 🔥" (positive) vs "I'll kill you" (threat)
- Sarcasm detection: "wow you're SO smart 🙄" (passive-aggressive)

### Stage 4: Emoji Sentiment Classification
- Emoji toxicity lexicon mapping:
  - Harmful: 🤮💀🖕🤡🐒🐵 (racial), 🔫🗡️💣 (threats)
  - Body shaming: 🐷🐖 when directed at someone
  - Mockery: 🤡 in bullying context
  - Emoji-only abuse detection
- Each emoji must be analyzed with its textual meaning and sentiment classification

### Stage 5: Toxicity Classification
Categories:
- non-toxic: Safe content (score < 0.3)
- offensive: Insults, profanity, name-calling (score 0.3-0.5)
- cyberbullying: Repeated targeting, body shaming, exclusion, social manipulation (score 0.5-0.7)
- hate_speech: Targeting race, gender, religion, sexuality, disability, caste (score 0.5-0.7)
- threat: Violence, doxxing, harm, death threats (score > 0.7)

### Output Requirements
You MUST respond using the provided tool function. Return ALL fields accurately:
- Identify the specific toxic words/phrases in the original text
- Analyze every emoji individually with meaning and sentiment
- Detect the primary language of the comment
- Assign confidence score (0.0 to 1.0)
- Severity mapping: none (<0.3), low (0.3-0.5), medium (0.5-0.7), high (>0.7)
- is_harmful = true when severity is "medium" or "high"`,
          },
          {
            role: "user",
            content: `Run the full MuRIL + XLM-RoBERTa pipeline on this comment and classify it:\n\n${comment}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_comment",
              description: "Output the complete MuRIL + XLM-RoBERTa pipeline classification result",
              parameters: {
                type: "object",
                properties: {
                  is_harmful: {
                    type: "boolean",
                    description: "true if toxicity score >= 0.5 (medium or high severity)",
                  },
                  reason: {
                    type: "string",
                    description: "Brief classification reason including detected category and language context",
                  },
                  severity: {
                    type: "string",
                    enum: ["none", "low", "medium", "high"],
                    description: "Toxicity severity level based on confidence threshold",
                  },
                  category: {
                    type: "string",
                    enum: ["non-toxic", "offensive", "cyberbullying", "hate_speech", "threat"],
                    description: "The primary toxicity category detected",
                  },
                  detected_language: {
                    type: "string",
                    description: "Primary language detected (e.g., English, Hindi, Hinglish, Arabic, etc.)",
                  },
                  toxic_words: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific toxic/abusive words or phrases found in the original text. Empty array if non-toxic.",
                  },
                  emoji_analysis: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emoji: { type: "string", description: "The emoji character" },
                        meaning: { type: "string", description: "Textual meaning of the emoji" },
                        sentiment: {
                          type: "string",
                          enum: ["positive", "negative", "neutral", "hostile"],
                          description: "Sentiment classification of the emoji in this context",
                        },
                      },
                      required: ["emoji", "meaning", "sentiment"],
                      additionalProperties: false,
                    },
                    description: "Analysis of each emoji in the comment. Empty array if no emojis present.",
                  },
                  confidence_score: {
                    type: "number",
                    description: "Toxicity confidence score from 0.0 (safe) to 1.0 (highly toxic)",
                  },
                },
                required: ["is_harmful", "reason", "severity", "category", "detected_language", "toxic_words", "emoji_analysis", "confidence_score"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_comment" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Moderation service temporarily unavailable");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({
          is_harmful: false,
          reason: "Could not classify",
          severity: "none",
          category: "non-toxic",
          detected_language: "unknown",
          toxic_words: [],
          emoji_analysis: [],
          confidence_score: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ error: "Moderation service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
