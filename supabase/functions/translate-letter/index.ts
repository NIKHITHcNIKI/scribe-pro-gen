import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed target languages (synced with frontend LetterPreview.tsx)
const ALLOWED_LANGUAGES = [
  'English', 'Hindi', 'Kannada', 'Telugu', 'Malayalam', 'Tamil',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu',
  'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian'
] as const;

// Input validation
function validateLetter(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('letter must be a string');
  }
  if (value.length < 1) {
    throw new Error('letter cannot be empty');
  }
  if (value.length > 20000) {
    throw new Error('letter must be at most 20000 characters');
  }
  return value;
}

function validateTargetLanguage(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('targetLanguage must be a string');
  }
  if (!ALLOWED_LANGUAGES.includes(value as typeof ALLOWED_LANGUAGES[number])) {
    throw new Error(`targetLanguage must be one of: ${ALLOWED_LANGUAGES.join(', ')}`);
  }
  return value;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please log in to translate letters' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication - Please log in again' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse and validate input
    const body = await req.json();
    const letter = validateLetter(body.letter);
    const targetLanguage = validateTargetLanguage(body.targetLanguage);

    console.log('Translating letter to:', targetLanguage, 'for user:', user.id);

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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the given letter to ${targetLanguage} while maintaining the professional tone, formatting, and structure. Keep all formal elements like dates, addresses, and salutations appropriately formatted for the target language. Only return the translated letter without any additional comments.`
          },
          {
            role: "user",
            content: letter
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway request failed");
    }

    const data = await response.json();
    const translatedLetter = data.choices?.[0]?.message?.content;

    if (!translatedLetter) {
      throw new Error("No translation received from AI");
    }

    console.log('Letter translated successfully for user:', user.id);

    return new Response(
      JSON.stringify({ translatedLetter }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to translate letter" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
