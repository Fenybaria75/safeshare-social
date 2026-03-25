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
            content: `You are a cyberbullying detection system. Analyze comments for harmful content including:
- Direct insults, slurs, hate speech
- Cyberbullying, threats, harassment
- Racist, sexist, homophobic, or discriminatory language
- Passive-aggressive bullying
- Harmful use of emojis (e.g., 🤮💀🖕 used to bully)
- Multilingual abuse (detect in ANY language: English, Spanish, French, Hindi, Arabic, Chinese, Korean, Japanese, etc.)
- Disguised hate speech (leetspeak, spacing tricks like "s t u p i d", symbol substitution)

You MUST respond using the provided tool.`,
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
      // Fallback: allow the comment
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
