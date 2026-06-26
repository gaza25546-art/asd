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

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "process";

    if (action === "scrape") {
      return await handleScrape(supabase);
    }

    if (action === "process-ai") {
      return await handleProcessAI(supabase);
    }

    if (action === "webhook") {
      return await handleWebhook(supabase, req);
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
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

// Make.com webhook handler - receives article data from Make.com scenarios
async function handleWebhook(supabase: any, req: Request) {
  const body = await req.json();

  // Validate required fields
  if (!body.title || !body.url) {
    return new Response(JSON.stringify({ error: "Missing title or url" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check for duplicate URL
  const { data: existing } = await supabase
    .from("scraped_articles")
    .select("id")
    .eq("original_url", body.url)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ message: "Article already exists", id: existing.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find or create source
  const { data: source } = await supabase
    .from("news_sources")
    .select("id")
    .eq("name", body.source || "Unknown")
    .maybeSingle();

  let sourceId = source?.id;
  if (!sourceId) {
    const { data: newSource } = await supabase
      .from("news_sources")
      .insert({ name: body.source || "Unknown", url: body.sourceUrl || "", source_type: "webhook" })
      .select("id")
      .single();
    sourceId = newSource?.id;
  }

  // Insert scraped article
  const { data: scraped, error } = await supabase
    .from("scraped_articles")
    .insert({
      source_id: sourceId,
      original_url: body.url,
      original_title: body.title,
      original_content: body.content || body.description || "",
      original_excerpt: body.description || body.excerpt || "",
      status: "pending_ai",
    })
    .select("*")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Trigger AI processing immediately
  const aiResult = await processArticleWithAI(supabase, scraped);

  return new Response(JSON.stringify({
    success: true,
    article: scraped,
    ai_processed: aiResult,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Process pending articles with AI
async function handleProcessAI(supabase: any) {
  const { data: pending } = await supabase
    .from("scraped_articles")
    .select("*")
    .eq("status", "pending_ai")
    .limit(5);

  const results = [];
  for (const article of pending ?? []) {
    const result = await processArticleWithAI(supabase, article);
    results.push(result);
  }

  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    results,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// AI processing using OpenRouter (free tier available)
async function processArticleWithAI(supabase: any, article: any) {
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

  if (!openRouterKey) {
    // Fallback: create a simple draft without AI
    const { data: draft } = await supabase
      .from("ai_drafts")
      .insert({
        scraped_article_id: article.id,
        draft_type: "article",
        generated_content: article.original_content,
        suggested_headline: article.original_title,
        status: "pending_review",
        review_status: "pending",
      })
      .select("id")
      .single();

    await supabase
      .from("scraped_articles")
      .update({ status: "pending_review", ai_draft_id: draft?.id })
      .eq("id", article.id);

    return { article_id: article.id, status: "pending_review", ai: false };
  }

  // Call OpenRouter for AI processing
  const prompt = `You are a professional sports journalist writing for DVSC (Debreceni Vasutas Sport Club) fan website.

Original article title: "${article.original_title}"
Original content: "${article.original_content?.substring(0, 3000)}"

Task:
1. Rewrite the article to be engaging, accurate, and suitable for DVSC fans
2. Create a catchy but professional headline (max 80 chars)
3. Write a compelling excerpt/summary (2-3 sentences)
4. Generate the full article content (200-400 words)
5. Suggest an appropriate category: Match Report, Transfer, Club News, or Academy
6. Suggest relevant SEO title and meta description

Respond in JSON format:
{
  "headline": "...",
  "excerpt": "...",
  "content": "...",
  "category": "...",
  "seo_title": "...",
  "meta_description": "..."
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
        "X-Title": "DVSC News Automation",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let parsed: any = {};
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, use raw content
      parsed = {
        headline: article.original_title,
        excerpt: article.original_excerpt,
        content: aiContent,
        category: "General",
        seo_title: article.original_title,
        meta_description: article.original_excerpt,
      };
    }

    // Create AI draft
    const { data: draft } = await supabase
      .from("ai_drafts")
      .insert({
        scraped_article_id: article.id,
        draft_type: "article",
        generated_content: parsed.content || article.original_content,
        suggested_headline: parsed.headline || article.original_title,
        seo_title: parsed.seo_title || parsed.headline || article.original_title,
        meta_description: parsed.meta_description || parsed.excerpt || article.original_excerpt,
        ai_summary: parsed.excerpt || article.original_excerpt,
        image_suggestion: "football stadium match",
        status: "pending_review",
        review_status: "pending",
        source_info: { original_url: article.original_url, source: article.source_id },
      })
      .select("id")
      .single();

    await supabase
      .from("scraped_articles")
      .update({ status: "pending_review", ai_draft_id: draft?.id })
      .eq("id", article.id);

    return { article_id: article.id, status: "pending_review", ai: true };
  } catch (err) {
    // On AI error, still create draft for manual review
    const { data: draft } = await supabase
      .from("ai_drafts")
      .insert({
        scraped_article_id: article.id,
        draft_type: "article",
        generated_content: article.original_content,
        suggested_headline: article.original_title,
        status: "pending_review",
        review_status: "pending",
      })
      .select("id")
      .single();

    await supabase
      .from("scraped_articles")
      .update({ status: "pending_review", ai_draft_id: draft?.id })
      .eq("id", article.id);

    return { article_id: article.id, status: "pending_review", ai: false, error: (err as Error).message };
  }
}

// Placeholder scrape handler (Make.com will do the actual scraping)
async function handleScrape(supabase: any) {
  return new Response(JSON.stringify({
    message: "Use Make.com for scraping. Call webhook endpoint with article data.",
    webhook_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-news-processor?action=webhook`,
    instructions: "In Make.com: 1) RSS module reads feeds, 2) HTTP module POSTs to this webhook with {title, url, content, description, source}",
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
