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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
            content: `You are an advanced multilingual cyberbullying and toxicity detection system inspired by models like MuRIL (Multilingual Representations for Indian Languages) and multilingual BERT.

Your job is to classify user-generated comments for harmful content. You MUST detect:

**Direct Abuse:**
- Insults, slurs, profanity, name-calling
- Threats of violence, doxxing, or harm
- Hate speech targeting race, gender, religion, sexuality, disability, caste, ethnicity

**Cyberbullying Patterns:**
- Repeated targeting or harassment
- Body shaming, appearance-based attacks
- Exclusion or social manipulation ("nobody likes you")
- Sarcastic or passive-aggressive bullying ("wow you're SO smart 🙄")

**Disguised Hate Speech:**
- Leetspeak: "h8", "f4g", "r3tard"
- Spacing tricks: "s t u p i d", "u g l y"
- Symbol substitution: "@$$", "$hit", "b!tch"
- Reversed/misspelled slurs
- Unicode tricks and homoglyphs

**Emoji-Based Abuse:**
- Harmful emoji combinations: 🤮💀🖕🤡🐒🐵 (used as slurs)
- Emoji-only bullying messages
- Emojis that mock or threaten: 🔫🗡️💣
- Contextual emoji abuse (e.g., 🐷🐖 directed at someone)

**Multilingual Detection (50+ languages):**
- English, Spanish, French, Portuguese, German, Italian, Dutch
- Hindi, Urdu, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi (Indian languages — MuRIL-style detection)
- Arabic, Farsi, Turkish, Hebrew
- Chinese (Simplified/Traditional), Japanese, Korean
- Russian, Ukrainian, Polish
- Swahili, Yoruba, Zulu
- Thai, Vietnamese, Indonesian, Malay, Filipino
- Code-switching (mixing languages in one comment, e.g., "you're such a बेवकूफ")

**Context-Aware Analysis:**
- Consider the FULL context, not just individual words
- "You killed it! 🔥" = positive (not harmful)
- "I'll kill you" = harmful
- Distinguish playful banter from genuine abuse
- Cultural context matters for emoji interpretation

You MUST respond using the provided tool. Be accurate — minimize false positives while catching real abuse.`,
          },
          {
            role: "user",
            content: `Analyze this comment for cyberbullying or harmful content: "${comment}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_comment",
              description: "Classify whether a comment contains cyberbullying or harmful content",
              parameters: {
                type: "object",
                properties: {
                  is_harmful: {
                    type: "boolean",
                    description: "true if the comment contains harmful/bullying content",
                  },
                  reason: {
                    type: "string",
                    description: "Brief reason for the classification",
                  },
                  severity: {
                    type: "string",
                    enum: ["none", "low", "medium", "high"],
                    description: "Severity level of the harmful content",
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
      throw new Error(`AI gateway error: ${response.status}`);
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
