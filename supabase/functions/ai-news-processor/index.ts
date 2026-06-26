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

    if (action === "webhook") {
      return await handleWebhook(supabase, req);
    }

    if (action === "process-ai") {
      return await handleProcessAI(supabase);
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

// ─── WEBHOOK HANDLER ─────────────────────────────────────────────
async function handleWebhook(supabase: any, req: Request) {
  const body = await req.json();

  if (!body.title || !body.url) {
    return new Response(JSON.stringify({ error: "Missing title or url" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1. Extract/fetch article content
  let articleContent = body.content || body.description || "";
  let articleDescription = body.description || "";

  // If content is empty but we have a Google News RSS link, try to fetch the real article
  if (!articleContent || articleContent.length < 50) {
    const fetched = await fetchArticleContent(body.url);
    if (fetched.content) articleContent = fetched.content;
    if (fetched.description) articleDescription = fetched.description;
  }

  // 2. Check for exact URL duplicate
  const { data: existingUrl } = await supabase
    .from("scraped_articles")
    .select("id, dedup_group_id")
    .eq("original_url", body.url)
    .maybeSingle();

  if (existingUrl) {
    return new Response(
      JSON.stringify({ message: "Article already exists (same URL)", id: existingUrl.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 3. Generate keyword signature and content hash for deduplication
  const keywordSig = generateKeywordSignature(body.title, articleContent);
  const contentHash = await hashContent(normalizeText(body.title + " " + articleContent));

  // 4. Check for duplicate by content hash (exact same content)
  const { data: hashDup } = await supabase
    .from("scraped_articles")
    .select("id, dedup_group_id, original_url, original_title, status")
    .eq("content_hash", contentHash)
    .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()) // Last 48h
    .maybeSingle();

  if (hashDup) {
    // Same content from different source — merge into existing group
    return await mergeDuplicate(supabase, hashDup, body, articleContent, articleDescription, keywordSig, contentHash);
  }

  // 5. Check for fuzzy duplicate by keyword signature (similar topic)
  const { data: similarArticles } = await supabase
    .from("scraped_articles")
    .select("id, dedup_group_id, original_url, original_title, keyword_signature, original_content, status")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
    .not("keyword_signature", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const fuzzyMatch = findFuzzyDuplicate(keywordSig, similarArticles || [], body.title);

  if (fuzzyMatch) {
    return await mergeDuplicate(supabase, fuzzyMatch, body, articleContent, articleDescription, keywordSig, contentHash);
  }

  // 6. No duplicate found — create new dedup group and insert
  const { data: dedupGroup } = await supabase
    .from("article_dedup_groups")
    .insert({
      canonical_title: body.title,
      canonical_url: body.url,
      sources_count: 1,
    })
    .select("id")
    .single();

  const sourceName = body.source || "Unknown";
  const { data: source } = await supabase
    .from("news_sources")
    .select("id")
    .eq("name", sourceName)
    .maybeSingle();

  let sourceId = source?.id;
  if (!sourceId) {
    const { data: newSource } = await supabase
      .from("news_sources")
      .insert({ name: sourceName, url: body.sourceUrl || "", source_type: "webhook" })
      .select("id")
      .single();
    sourceId = newSource?.id;
  }

  const { data: scraped, error } = await supabase
    .from("scraped_articles")
    .insert({
      source_id: sourceId,
      original_url: body.url,
      original_title: body.title,
      original_content: articleContent,
      original_excerpt: articleDescription,
      keyword_signature: keywordSig,
      content_hash: contentHash,
      dedup_group_id: dedupGroup?.id,
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

  // 7. Process with AI
  const aiResult = await processArticleWithAI(supabase, scraped, dedupGroup?.id);

  return new Response(
    JSON.stringify({
      success: true,
      article: scraped,
      ai_processed: aiResult,
      deduplication: { is_duplicate: false, group_id: dedupGroup?.id },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── MERGE DUPLICATE ─────────────────────────────────────────────
async function mergeDuplicate(
  supabase: any,
  existing: any,
  body: any,
  articleContent: string,
  articleDescription: string,
  keywordSig: string,
  contentHash: string
) {
  const dedupGroupId = existing.dedup_group_id;

  // Find or create source
  const sourceName = body.source || "Unknown";
  const { data: source } = await supabase
    .from("news_sources")
    .select("id")
    .eq("name", sourceName)
    .maybeSingle();

  let sourceId = source?.id;
  if (!sourceId) {
    const { data: newSource } = await supabase
      .from("news_sources")
      .insert({ name: sourceName, url: body.sourceUrl || "", source_type: "webhook" })
      .select("id")
      .single();
    sourceId = newSource?.id;
  }

  // Insert as duplicate with link to existing group
  const { data: scrapedDup } = await supabase
    .from("scraped_articles")
    .insert({
      source_id: sourceId,
      original_url: body.url,
      original_title: body.title,
      original_content: articleContent,
      original_excerpt: articleDescription,
      keyword_signature: keywordSig,
      content_hash: contentHash,
      dedup_group_id: dedupGroupId,
      is_duplicate: true,
      status: "duplicate",
    })
    .select("*")
    .single();

  // Update dedup group source count
  await supabase
    .from("article_dedup_groups")
    .update({
      sources_count: supabase.rpc("increment", { x: 1 }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", dedupGroupId);

  // Add this source to the existing AI draft's related_sources
  const { data: existingDraft } = await supabase
    .from("ai_drafts")
    .select("id, related_sources, review_status")
    .eq("dedup_group_id", dedupGroupId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingDraft && existingDraft.review_status === "pending") {
    const related = existingDraft.related_sources || [];
    related.push({
      source: body.source || "Unknown",
      url: body.url,
      title: body.title,
      added_at: new Date().toISOString(),
    });

    await supabase
      .from("ai_drafts")
      .update({ related_sources: related })
      .eq("id", existingDraft.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Duplicate article detected and merged with existing topic",
      article: scrapedDup,
      existing_article_id: existing.id,
      dedup_group_id: dedupGroupId,
      is_duplicate: true,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── FETCH ARTICLE CONTENT ───────────────────────────────────────
async function fetchArticleContent(url: string): Promise<{ content: string; description: string }> {
  try {
    // Handle Google News RSS redirect URLs
    if (url.includes("news.google.com/rss/articles/")) {
      // Try to follow the redirect to get the real article
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const finalUrl = response.url;
      if (finalUrl !== url && !finalUrl.includes("news.google.com")) {
        // We got redirected to the real article
        const articleHtml = await response.text();
        return extractFromHtml(articleHtml, finalUrl);
      }

      // If still on Google, try to extract from the RSS entry itself
      // The Google News RSS usually has the content in the feed
      return { content: "", description: "" };
    }

    // For direct article URLs, try to fetch the page
    if (url.startsWith("http")) {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      const articleHtml = await response.text();
      return extractFromHtml(articleHtml, url);
    }
  } catch (err) {
    console.error("Failed to fetch article content:", err);
  }

  return { content: "", description: "" };
}

function extractFromHtml(html: string, url: string): { content: string; description: string } {
  // Remove scripts and styles
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

  // Try to find article content in common containers
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*(?:article|content|post-body|entry-content|story-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["'][^"']*(?:article|content|post-body|entry-content|story-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  let articleContent = "";
  for (const pattern of articlePatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      articleContent = match[1];
      break;
    }
  }

  // If no article container found, try to extract all paragraph text
  if (!articleContent) {
    const paragraphs = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (paragraphs) {
      articleContent = paragraphs.slice(0, 20).join("\n"); // First 20 paragraphs
    }
  }

  // Extract description from meta tags
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
  const description = descMatch ? descMatch[1] : "";

  // Clean HTML tags from content
  const textContent = articleContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    content: textContent.substring(0, 8000), // Limit length
    description: description.substring(0, 500),
  };
}

// ─── KEYWORD SIGNATURE ───────────────────────────────────────────
function generateKeywordSignature(title: string, content: string): string {
  const text = normalizeText(title + " " + content);

  // Hungarian stop words
  const stopWords = new Set([
    "a", "az", "egy", "és", "is", "meg", "nem", "hogy", "van", "volt",
    "lesz", "kell", "már", "még", "csak", "mint", "ide", "oda", "itt",
    "ott", "ki", "mi", "ő", "ők", "te", "ti", "én", "miért", "hogyan",
    "the", "and", "for", "are", "but", "not", "you", "all", "can",
    "had", "her", "was", "one", "our", "out", "day", "get", "has",
    "him", "his", "how", "its", "may", "new", "now", "old", "see",
    "two", "who", "boy", "did", "she", "use", "her", "way", "many",
    "oil", "sit", "set", "run", "eat", "far", "sea", "eye", "ago",
    "off", "too", "any", "say", "man", "try", "ask", "end", "why",
    "let", "put", "say", "she", "try", "way", "own", "say", "too",
    "old", "tell", "very", "when", "come", "could", "would", "there",
    "their", "what", "said", "each", "which", "will", "about", "if",
    "up", "out", "many", "then", "them", "these", "so", "some", "her",
    "would", "make", "like", "into", "him", "has", "two", "more",
    "go", "no", "way", "could", "my", "than", "first", "water",
    "been", "call", "who", "its", "now", "find", "long", "down",
    "day", "did", "get", "made", "may", "part", "over", "such",
    "take", "than", "them", "well", "were",
  ]);

  // Extract keywords: words with 4+ chars that aren't stop words
  const words = text.split(/\s+/);
  const keywords = words
    .filter((w) => w.length >= 4 && !stopWords.has(w))
    .reduce((acc: Record<string, number>, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {});

  // Sort by frequency and take top 15
  const sorted = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w);

  return sorted.join("|");
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F]/g, " ") // Keep accented chars
    .replace(/\s+/g, " ")
    .trim();
}

async function hashContent(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── FUZZY DUPLICATE DETECTION ───────────────────────────────────
// Synonym mapping for Hungarian football terms
const SYNONYMS: Record<string, string[]> = {
  "dvsc": ["dvsc", "debrecen", "debreceni", "loki", "lok"],
  "debrecen": ["dvsc", "debrecen", "debreceni", "loki", "lok"],
  "loki": ["dvsc", "debrecen", "debreceni", "loki", "lok"],
  "francia": ["francia", "france", "franciaorszagi"],
  "csatar": ["csatar", "tamado", "tamadot", "tamadot", "tamado"],
  "tamado": ["csatar", "tamado", "tamadot", "tamadot", "tamado"],
  "igazolas": ["igazolas", "igazolt", "szerzodtetes", "szerzodtetett", "szerzodtetett", "szerzodtetes"],
  "szerzodtetes": ["igazolas", "igazolt", "szerzodtetes", "szerzodtetett", "szerzodtetett", "szerzodtetes"],
  "igazolt": ["igazolas", "igazolt", "szerzodtetes", "szerzodtetett", "szerzodtetett", "szerzodtetes"],
  "szerzodtetett": ["igazolas", "igazolt", "szerzodtetes", "szerzodtetett", "szerzodtetett", "szerzodtetes"],
};

function normalizeWithSynonyms(word: string): string {
  const lower = word.toLowerCase();
  for (const [canonical, variants] of Object.entries(SYNONYMS)) {
    if (variants.includes(lower)) return canonical;
  }
  return lower;
}

function findFuzzyDuplicate(
  keywordSig: string,
  candidates: any[],
  newTitle: string
): any | null {
  const newKeywords = new Set(keywordSig.split("|").map(normalizeWithSynonyms));
  const newTitleWords = new Set(
    normalizeText(newTitle).split(/\s+/).filter((w) => w.length >= 4).map(normalizeWithSynonyms)
  );

  for (const candidate of candidates) {
    // Check keyword overlap with synonym normalization
    const candKeywords = new Set(
      (candidate.keyword_signature || "").split("|").map(normalizeWithSynonyms)
    );
    const keywordOverlap = [...newKeywords].filter((k) => candKeywords.has(k)).length;
    const keywordUnion = new Set([...newKeywords, ...candKeywords]).size;
    const keywordSimilarity = keywordUnion > 0 ? keywordOverlap / keywordUnion : 0;

    // Check title word overlap with synonym normalization
    const candTitleWords = new Set(
      normalizeText(candidate.original_title)
        .split(/\s+/)
        .filter((w: string) => w.length >= 4)
        .map(normalizeWithSynonyms)
    );
    const titleOverlap = [...newTitleWords].filter((w) => candTitleWords.has(w)).length;
    const titleUnion = new Set([...newTitleWords, ...candTitleWords]).size;
    const titleSimilarity = titleUnion > 0 ? titleOverlap / titleUnion : 0;

    // Also check for shared important keywords (DVSC + topic keywords)
    const sharedImportant = [...newKeywords].filter((k) => {
      // These are the most important keywords that indicate same topic
      const importantTerms = ["dvsc", "debrecen", "loki", "francia", "csatar", "tamado", "igazolas", "szerzodtetes", "igazolt", "szerzodtetett"];
      return importantTerms.includes(k) && candKeywords.has(k);
    }).length;

    // Lowered thresholds + shared important keywords check
    if (keywordSimilarity >= 0.25 || titleSimilarity >= 0.35 || sharedImportant >= 2) {
      return candidate;
    }
  }

  return null;
}

// ─── AI PROCESSING ───────────────────────────────────────────────
async function handleProcessAI(supabase: any) {
  const { data: pending } = await supabase
    .from("scraped_articles")
    .select("*")
    .eq("status", "pending_ai")
    .limit(5);

  const results = [];
  for (const article of pending ?? []) {
    const result = await processArticleWithAI(supabase, article, article.dedup_group_id);
    results.push(result);
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function processArticleWithAI(supabase: any, article: any, dedupGroupId: string | null) {
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

  // Gather all related source content for richer AI processing
  let combinedContent = article.original_content || "";
  let combinedTitle = article.original_title || "";

  if (dedupGroupId) {
    const { data: relatedArticles } = await supabase
      .from("scraped_articles")
      .select("original_title, original_content, original_url, is_duplicate")
      .eq("dedup_group_id", dedupGroupId)
      .neq("id", article.id);

    if (relatedArticles && relatedArticles.length > 0) {
      for (const related of relatedArticles) {
        if (related.original_content && related.original_content.length > combinedContent.length) {
          combinedContent = related.original_content;
        }
        // Use the most descriptive title
        if (related.original_title && related.original_title.length > combinedTitle.length) {
          combinedTitle = related.original_title;
        }
      }
    }
  }

  if (!openRouterKey) {
    // Fallback: create draft without AI
    const { data: draft } = await supabase
      .from("ai_drafts")
      .insert({
        scraped_article_id: article.id,
        draft_type: "article",
        generated_content: combinedContent || article.original_content,
        suggested_headline: combinedTitle || article.original_title,
        status: "pending_review",
        review_status: "pending",
        dedup_group_id: dedupGroupId,
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

Original article title: "${combinedTitle || article.original_title}"
Original content: "${(combinedContent || article.original_content)?.substring(0, 4000)}"

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

    let parsed: any = {};
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed = {
        headline: combinedTitle || article.original_title,
        excerpt: article.original_excerpt,
        content: aiContent,
        category: "General",
        seo_title: combinedTitle || article.original_title,
        meta_description: article.original_excerpt,
      };
    }

    // Get related sources for the draft
    const relatedSources: any[] = [];
    if (dedupGroupId) {
      const { data: related } = await supabase
        .from("scraped_articles")
        .select("original_url, original_title, is_duplicate, news_sources(name)")
        .eq("dedup_group_id", dedupGroupId)
        .neq("id", article.id);

      if (related) {
        for (const r of related) {
          relatedSources.push({
            source: r.news_sources?.name || "Unknown",
            url: r.original_url,
            title: r.original_title,
          });
        }
      }
    }

    const { data: draft } = await supabase
      .from("ai_drafts")
      .insert({
        scraped_article_id: article.id,
        draft_type: "article",
        generated_content: parsed.content || article.original_content,
        suggested_headline: parsed.headline || combinedTitle || article.original_title,
        seo_title: parsed.seo_title || parsed.headline || combinedTitle || article.original_title,
        meta_description: parsed.meta_description || parsed.excerpt || article.original_excerpt,
        ai_summary: parsed.excerpt || article.original_excerpt,
        image_suggestion: "football stadium match",
        status: "pending_review",
        review_status: "pending",
        dedup_group_id: dedupGroupId,
        related_sources: relatedSources.length > 0 ? relatedSources : [],
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
    const { data: draft } = await supabase
      .from("ai_drafts")
      .insert({
        scraped_article_id: article.id,
        draft_type: "article",
        generated_content: combinedContent || article.original_content,
        suggested_headline: combinedTitle || article.original_title,
        status: "pending_review",
        review_status: "pending",
        dedup_group_id: dedupGroupId,
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
