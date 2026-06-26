import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user is authenticated and is an admin/editor
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !["editor", "super_admin"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, prompt } = await req.json();

    // Generate content based on type
    const generated = generateContent(type, prompt);

    // Save as AI draft
    const { data: draft, error } = await supabase.from("ai_drafts").insert({
      draft_type: type,
      source_info: { prompt, generated_at: new Date().toISOString(), model: "dvsc-template-v1" },
      generated_content: generated.content,
      suggested_headline: generated.headline,
      seo_title: generated.seoTitle,
      meta_description: generated.metaDescription,
      image_suggestion: generated.imageSuggestion,
      ai_summary: generated.summary,
      status: "pending",
    }).select("id").single();

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({
      success: true,
      draft_id: draft?.id,
      message: "AI draft generated and saved for approval",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateContent(type: string, prompt: string): any {
  const cleanPrompt = prompt.trim();

  switch (type) {
    case "article":
      return {
        headline: `DVSC: ${cleanPrompt}`,
        seoTitle: `${cleanPrompt} | DVSC Official Fan Site`,
        metaDescription: `Read the latest news about ${cleanPrompt}. Stay updated with DVSC - Debreceni Vasutas Sport Club.`,
        summary: `Breaking news from Nagyerdei Stadion: ${cleanPrompt}. The club continues to build for the future with this latest development.`,
        content: `Debreceni VSC can confirm that ${cleanPrompt}.\n\nThe news was announced today, with the club moving quickly to address the situation. This development represents a significant step for DVSC as they continue to compete at the highest level of Hungarian football.\n\nManager and club officials have expressed their confidence in the decision, with supporters eagerly anticipating the impact of this development on the team's performance.\n\nSpeaking about the news, a club spokesperson said: "This is an important moment for DVSC. We are committed to bringing success to Debrecen and this is part of that journey."\n\nThe red and white army will be watching closely as the situation develops. Stay tuned to DVSC Fan Portal for all the latest updates.\n\nHajra Loki!`,
        imageSuggestion: "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg",
      };

    case "preview":
      return {
        headline: `Match Preview: DVSC vs ${cleanPrompt}`,
        seoTitle: `DVSC vs ${cleanPrompt} - Match Preview | DVSC`,
        metaDescription: `Preview of DVSC's upcoming match against ${cleanPrompt}. Team news, predictions, and key battles to watch.`,
        summary: `DVSC prepare to face ${cleanPrompt} in what promises to be a crucial encounter at Nagyerdei Stadion.`,
        content: `DVSC return to action this weekend as they prepare to face ${cleanPrompt} at the Nagyerdei Stadion.\n\nThe match presents an important opportunity for the Loki to continue their strong form and climb the NB I table.\n\nKey battles to watch:\n- The midfield contest will be crucial in determining the outcome\n- DVSC's attacking firepower against the opposition defense\n- Home advantage could prove decisive\n\nThe manager is expected to name a strong starting XI, with several players returning from international duty.\n\nWith the passionate support of the red and white army behind them, DVSC will be confident of securing all three points.\n\nKick-off is scheduled for this weekend. Hajra Loki!`,
        imageSuggestion: "https://images.pexels.com/photos/47730/the-ball-stadion-football-the-pitch-47730.jpeg",
      };

    case "report":
      return {
        headline: `Match Report: DVSC vs ${cleanPrompt}`,
        seoTitle: `DVSC vs ${cleanPrompt} - Full Match Report | DVSC`,
        metaDescription: `Full match report as DVSC take on ${cleanPrompt}. Goals, highlights, and player ratings.`,
        summary: `A full match report as DVSC faced ${cleanPrompt} in front of a passionate home crowd.`,
        content: `DVSC put in a spirited performance as they faced ${cleanPrompt} at the Nagyerdei Stadion.\n\nThe match began at a frantic pace, with both sides looking to assert their dominance early on. The home support was in full voice, creating an electric atmosphere.\n\nDVSC grew into the game and created several promising opportunities. The midfield controlled the tempo, while the attacking players looked dangerous going forward.\n\nThe second half saw DVSC push for a breakthrough, with the manager making tactical adjustments to try and find the winning goal.\n\nIn the end, the match provided plenty of talking points for the supporters. The red and white army will be looking ahead to the next fixture with optimism.\n\nHajra Loki!`,
        imageSuggestion: "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg",
      };

    case "transfer":
      return {
        headline: `Transfer News: DVSC linked with ${cleanPrompt}`,
        seoTitle: `DVSC Transfer News: ${cleanPrompt} | DVSC`,
        metaDescription: `DVSC are reportedly interested in signing ${cleanPrompt}. Transfer rumors and latest updates.`,
        summary: `DVSC are reportedly monitoring ${cleanPrompt} as a potential transfer target.`,
        content: `DVSC are reportedly interested in signing ${cleanPrompt}, according to sources close to the club.\n\nThe transfer rumor suggests that the Debrecen side are looking to strengthen their squad, with ${cleanPrompt} identified as a potential target.\n\nWhile no official bid has been confirmed, the speculation has generated excitement among the DVSC fanbase, who are always eager to see new arrivals at the Nagyerdei Stadion.\n\nThe club has remained tight-lipped on the matter, but the transfer window provides opportunities for movement.\n\nStay tuned to DVSC Fan Portal for the latest transfer news and updates. Hajra Loki!`,
        imageSuggestion: "https://images.pexels.com/photos/258700/pexels-photo-258700.jpeg",
      };

    case "social":
      return {
        headline: `Social Media Caption: ${cleanPrompt}`,
        seoTitle: cleanPrompt,
        metaDescription: `Social media caption for ${cleanPrompt}`,
        summary: `Hajra Loki! ${cleanPrompt} - The red and white army stands proud!`,
        content: `Hajra Loki! ${cleanPrompt}\n\nThe passion never stops. The red and white army marches on!\n\n#DVSC #HajraLoki #Debrecen #NB1`,
        imageSuggestion: "https://images.pexels.com/photos/1142964/pexels-photo-1142964.jpeg",
      };

    case "seo":
      return {
        headline: `SEO Metadata for: ${cleanPrompt}`,
        seoTitle: `${cleanPrompt} | DVSC - Debreceni VSC Fan Portal`,
        metaDescription: `Get the latest ${cleanPrompt} news, updates, and analysis from DVSC Fan Portal. Your ultimate destination for Debreceni VSC content.`,
        summary: `SEO-optimized metadata generated for ${cleanPrompt}`,
        content: `SEO Metadata Generated:\n\nTitle: ${cleanPrompt} | DVSC - Debreceni VSC Fan Portal\nDescription: Get the latest ${cleanPrompt} news, updates, and analysis from DVSC Fan Portal.\nKeywords: DVSC, Debrecen, ${cleanPrompt}, Hungarian football, NB I\nCanonical: /news/${cleanPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        imageSuggestion: "",
      };

    case "summary":
      return {
        headline: `Summary: ${cleanPrompt}`,
        seoTitle: `Summary: ${cleanPrompt} | DVSC`,
        metaDescription: `A concise summary of ${cleanPrompt} from DVSC Fan Portal.`,
        summary: `Here is a brief summary of ${cleanPrompt}.`,
        content: `Summary of ${cleanPrompt}:\n\nThis article covers the key points about ${cleanPrompt}. The main takeaways include the significance of this development for DVSC and what it means for the supporters.\n\nKey points:\n- DVSC continues to make progress\n- The supporters remain passionate and committed\n- The future looks bright for the red and white of Debrecen`,
        imageSuggestion: "",
      };

    default:
      return {
        headline: `DVSC: ${cleanPrompt}`,
        seoTitle: `${cleanPrompt} | DVSC`,
        metaDescription: `Read about ${cleanPrompt} on DVSC Fan Portal.`,
        summary: `Latest update: ${cleanPrompt}`,
        content: `${cleanPrompt}\n\nStay tuned to DVSC Fan Portal for more updates. Hajra Loki!`,
        imageSuggestion: "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg",
      };
  }
}
