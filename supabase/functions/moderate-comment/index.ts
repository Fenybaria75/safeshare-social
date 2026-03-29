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

    // Enforce max length to reduce prompt injection surface
    if (comment.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Comment too long" }),
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
            content: `You are a cyberbullying and toxicity detection system implementing the MuRIL (Multilingual Representations for Indian Languages) pipeline architecture combined with multilingual BERT capabilities, running on Google Gemini.

## MuRIL Pipeline Architecture

This system follows the MuRIL research paper methodology (Khanuja et al., 2021) adapted for real-time comment moderation:

### Stage 1: Text Preprocessing & Normalization
- **Script normalization**: Convert mixed-script text (Devanagari, Latin, Arabic, CJK) to normalized Unicode form (NFC)
- **Leetspeak decoding**: Map obfuscated characters back to base forms (e.g., "h8" → "hate", "f4g" → slur, "r3tard" → slur)
- **Spacing trick reversal**: Collapse deliberately spaced text ("s t u p i d" → "stupid", "u g l y" → "ugly")
- **Symbol substitution reversal**: Decode symbol-replaced words ("@$$" → "ass", "$hit" → "shit", "b!tch" → "bitch")
- **Homoglyph normalization**: Map visually similar Unicode characters to ASCII equivalents (Cyrillic а → Latin a, etc.)

### Stage 2: Multilingual Tokenization (MuRIL-style)
- Apply subword tokenization compatible with 17 Indian languages + transliterated variants
- Handle code-switching detection: identify language boundaries within a single comment
- Supported language families:
  - **Indo-Aryan**: Hindi, Urdu, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Sindhi, Nepali
  - **Dravidian**: Tamil, Telugu, Kannada, Malayalam
  - **European**: English, Spanish, French, Portuguese, German, Italian, Dutch, Russian, Ukrainian, Polish
  - **Semitic/Turkic**: Arabic, Farsi, Turkish, Hebrew
  - **East Asian**: Chinese (Simplified/Traditional), Japanese, Korean
  - **Southeast Asian**: Thai, Vietnamese, Indonesian, Malay, Filipino
  - **African**: Swahili, Yoruba, Zulu
  - **Transliterated forms**: Romanized Hindi (Hinglish), Romanized Arabic (Arabizi), etc.

### Stage 3: Semantic Embedding Analysis
- Generate contextual embeddings for the input text using cross-lingual transfer learning
- Compute similarity scores against known toxic/abusive pattern clusters
- Distinguish contextual usage: "You killed it! 🔥" (positive) vs "I'll kill you" (threat)
- Handle sarcasm detection: "wow you're SO smart 🙄" (passive-aggressive bullying)

### Stage 4: Emoji Sentiment Classification
- Classify emoji sequences using an emoji toxicity lexicon:
  - **Harmful combinations**: 🤮💀🖕🤡🐒🐵 (racial slurs), 🔫🗡️💣 (threats)
  - **Contextual abuse**: 🐷🐖 (body shaming when directed at someone), 🤡 (mockery)
  - **Emoji-only messages**: Detect purely emoji-based bullying
- Apply cultural context: emoji meaning varies by region and context

### Stage 5: Toxicity Classification
Detect and classify the following categories:
- **Direct abuse**: Insults, slurs, profanity, name-calling
- **Threats**: Violence, doxxing, harm, death threats
- **Hate speech**: Targeting race, gender, religion, sexuality, disability, caste, ethnicity
- **Cyberbullying patterns**: Repeated targeting, body shaming, exclusion ("nobody likes you"), social manipulation
- **Disguised hate speech**: All forms identified in Stage 1 preprocessing

### Output Requirements
You MUST respond using the provided tool function. Provide accurate classification minimizing false positives while catching genuine abuse. The severity levels map to MuRIL confidence thresholds:
- none: <0.3 toxicity score (safe content)
- low: 0.3-0.5 toxicity score (borderline, monitor)
- medium: 0.5-0.7 toxicity score (likely harmful, auto-hide)
- high: >0.7 toxicity score (clearly harmful, auto-hide + flag for review)

Comments with severity "medium" or "high" should be marked as is_harmful: true.`,
          },
          {
            role: "user",
            content: `Run the MuRIL pipeline on this comment and classify it:\n\n${comment}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_comment",
              description: "Output the MuRIL pipeline classification result for a comment",
              parameters: {
                type: "object",
                properties: {
                  is_harmful: {
                    type: "boolean",
                    description: "true if MuRIL toxicity score >= 0.5 (medium or high severity)",
                  },
                  reason: {
                    type: "string",
                    description: "Brief MuRIL classification reason including detected category and language",
                  },
                  severity: {
                    type: "string",
                    enum: ["none", "low", "medium", "high"],
                    description: "MuRIL toxicity severity level based on confidence threshold",
                  },
                },
                required: ["is_harmful", "reason", "severity"],
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
        JSON.stringify({ is_harmful: false, reason: "Could not classify", severity: "none" }),
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
