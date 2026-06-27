import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_COVER_IMAGE = "https://images.unsplash.com/photo-1577223625816-7546f13f4e2c?w=800&h=500&fit=crop";

// Source suffixes to strip from titles (Hungarian news sites)
const SOURCE_SUFFIXES = [
  /\s*[-–—]\s*(?:M4\s*Sport|m4sport)$/i,
  /\s*[-–—]\s*(?:NSO|Nemzeti\s*Sport)$/i,
  /\s*[-–—]\s*(?:Dehir|DEHIR)$/i,
  /\s*[-–—]\s*(?:HAON|Haon)$/i,
  /\s*[-–—]\s*(?:CsakFoci|Csak\s*Foci)$/i,
  /\s*[-–—]\s*(?:NB1\.hu|NB1)$/i,
  /\s*[-–—]\s*(?:Transfermarkt)$/i,
  /\s*[-–—]\s*(?:Index)$/i,
  /\s*[-–—]\s*(?:Origo)$/i,
  /\s*[-–—]\s*(?:24\.hu|24hu)$/i,
  /\s*[-–—]\s*(?:Telex)$/i,
  /\s*[-–—]\s*(?:444)$/i,
  /\s*[-–—]\s*(?:RTL|RTL\s*Klub)$/i,
  /\s*[-–—]\s*(?:TV2)$/i,
  /\s*[-–—]\s*(?:Duna\s*TV|Duna)$/i,
  /\s*[-–—]\s*(?:ATV)$/i,
  /\s*[-–—]\s*(?:Hír\s*TV|HirTV)$/i,
  /\s*[-–—]\s*(?:Blikk)$/i,
  /\s*[-–—]\s*(?:Bors)$/i,
  /\s*[-–—]\s*(?:Ripost)$/i,
  /\s*[-–—]\s*(?:Story)$/i,
  /\s*[-–—]\s*(?:Best)$/i,
  /\s*[-–—]\s*(?:Life\.hu|Life)$/i,
  /\s*[-–—]\s*(?:NLC)$/i,
  /\s*[-–—]\s*(?:Femina)$/i,
  /\s*[-–—]\s*(?:Woman\.hu|Woman)$/i,
  /\s*[-–—]\s*(?:Cosmopolitan)$/i,
  /\s*[-–—]\s*(?:Joy)$/i,
  /\s*[-–—]\s*(?:Shape)$/i,
  /\s*[-–—]\s*(?:Men's\s*Health|Men'sHealth)$/i,
  /\s*[-–—]\s*(?:Women's\s*Health|Women'sHealth)$/i,
  /\s*[-–—]\s*(?:Runner's\s*World|RunnersWorld)$/i,
  /\s*[-–—]\s*(?:Bike\s*Magazine|BikeMagazine)$/i,
  /\s*[-–—]\s*(?:4*4\s*Magazine|4x4Magazine)$/i,
  /\s*[-–—]\s*(?:Auto\s*Motor|AutoMotor)$/i,
  /\s*[-–—]\s*(?:Totalcar)$/i,
  /\s*[-–—]\s*(?:Autonavigator)$/i,
  /\s*[-–—]\s*(?:Autós\s*Magazin|AutosMagazin)$/i,
  /\s*[-–—]\s*(?:Vezess)$/i,
  /\s*[-–—]\s*(?:Nők\s*Lapja|NokLapja)$/i,
  /\s*[-–—]\s*(?:Éva|Eva)$/i,
  /\s*[-–—]\s*(?:Marie\s*Claire|MarieClaire)$/i,
  /\s*[-–—]\s*(?:Glamour)$/i,
  /\s*[-–—]\s*(?:InStyle)$/i,
  /\s*[-–—]\s*(?:Elle)$/i,
  /\s*[-–—]\s*(?:Vogue)$/i,
  /\s*[-–—]\s*(?:Harper's\s*Bazaar|HarpersBazaar)$/i,
  /\s*[-–—]\s*(?:Forbes)$/i,
  /\s*[-–—]\s*(?:HVG)$/i,
  /\s*[-–—]\s*(?:Figyelő|Figyelo)$/i,
  /\s*[-–—]\s*(?:Magyar\s*Narancs|MagyarNarancs)$/i,
  /\s*[-–—]\s*(?:168\s*Óra|168Ora)$/i,
  /\s*[-–—]\s*(?:Valasz|Válasz)$/i,
  /\s*[-–—]\s*(?:Mandiner)$/i,
  /\s*[-–—]\s*(?:Pesti\s*Srácok|PestiSrácok)$/i,
  /\s*[-–—]\s*(?:Alfahír|Alfahir)$/i,
  /\s*[-–—]\s*(?:Kuruc\.info|Kuruc)$/i,
  /\s*[-–—]\s*(?:Hídfő|Hidfo)$/i,
  /\s*[-–—]\s*(?:Metropol)$/i,
  /\s*[-–—]\s*(?:City)$/i,
  /\s*[-–—]\s*(?:Pestiest)$/i,
  /\s*[-–—]\s*(?:Welovebudapest)$/i,
  /\s*[-–—]\s*(?:Funzine)$/i,
  /\s*[-–—]\s*(?:Time\s*Out|TimeOut)$/i,
  /\s*[-–—]\s*(?:We\s*Love\s*Balaton|WeLoveBalaton)$/i,
  /\s*[-–—]\s*(?:LikeBalaton)$/i,
  /\s*[-–—]\s*(?:Szallas\.hu|Szallas)$/i,
  /\s*[-–—]\s*(?:Tripadvisor)$/i,
  /\s*[-–—]\s*(?:Booking\.com|Booking)$/i,
  /\s*[-–—]\s*(?:Airbnb)$/i,
  /\s*[-–—]\s*(?:Szép\s*kártya|Szepkártya)$/i,
  /\s*[-–—]\s*(?:OTP\s*SZÉP\s*kártya|OTPSZEP)$/i,
  /\s*[-–—]\s*(?:MKB\s*SZÉP\s*kártya|MKBSZEP)$/i,
  /\s*[-–—]\s*(?:K&H\s*SZÉP\s*kártya|KHSZEP)$/i,
  /\s*[-–—]\s*(?:Erzsébet\s*utalvány|Erzsébet)$/i,
  /\s*[-–—]\s*(?:Edenred)$/i,
  /\s*[-–—]\s*(?:Sodexo)$/i,
  /\s*[-–—]\s*(?:Ticket\s*Restaurant|TicketRestaurant)$/i,
  /\s*[-–—]\s*(?:Cheque\s*Déjeuner|ChequeDejeuner)$/i,
  /\s*[-–—]\s*(?:Up\s*Szép\s*kártya|UpSZEP)$/i,
  /\s*[-–—]\s*(?:Google\s*News|GoogleNews)$/i,
  /\s*[-–—]\s*(?:Yahoo\s*News|YahooNews)$/i,
  /\s*[-–—]\s*(?:MSN\s*News|MSNNews)$/i,
  /\s*[-–—]\s*(?:Apple\s*News|AppleNews)$/i,
  /\s*[-–—]\s*(?:Flipboard)$/i,
  /\s*[-–—]\s*(?:Feedly)$/i,
  /\s*[-–—]\s*(?:Inoreader)$/i,
  /\s*[-–—]\s*(?:NewsBlur)$/i,
  /\s*[-–—]\s*(?:The\s*Old\s*Reader|TheOldReader)$/i,
  /\s*[-–—]\s*(?:Feedspot)$/i,
  /\s*[-–—]\s*(?:Alltop)$/i,
  /\s*[-–—]\s*(?:Popurls)$/i,
  /\s*[-–—]\s*(?:Techmeme)$/i,
  /\s*[-–—]\s*(?:Memeorandum)$/i,
  /\s*[-–—]\s*(?:Mediagazer)$/i,
  /\s*[-–—]\s*(?:Wesmirch)$/i,
  /\s*[-–—]\s*(?:Buzzsumo)$/i,
  /\s*[-–—]\s*(?:Ahrefs)$/i,
  /\s*[-–—]\s*(?:SEMrush)$/i,
  /\s*[-–—]\s*(?:Moz)$/i,
  /\s*[-–—]\s*(?:Majestic)$/i,
  /\s*[-–—]\s*(?:Ubersuggest)$/i,
  /\s*[-–—]\s*(?:SpyFu)$/i,
  /\s*[-–—]\s*(?:Sistrix)$/i,
  /\s*[-–—]\s*(?:Searchmetrics)$/i,
  /\s*[-–—]\s*(?:Raven\s*Tools|RavenTools)$/i,
  /\s*[-–—]\s*(?:BrightEdge)$/i,
  /\s*[-–—]\s*(?:Conductor)$/i,
  /\s*[-–—]\s*(?:Search\s*Engine\s*Land|SearchEngineLand)$/i,
  /\s*[-–—]\s*(?:Search\s*Engine\s*Journal|SearchEngineJournal)$/i,
  /\s*[-–—]\s*(?:Search\s*Engine\s*Watch|SearchEngineWatch)$/i,
  /\s*[-–—]\s*(?:Moz\s*Blog|MozBlog)$/i,
  /\s*[-–—]\s*(?:Backlinko)$/i,
  /\s*[-–—]\s*(?:Neil\s*Patel|NeilPatel)$/i,
  /\s*[-–—]\s*(?:Brian\s*Dean|BrianDean)$/i,
  /\s*[-–—]\s*(?:Matt\s*Cutts|MattCutts)$/i,
  /\s*[-–—]\s*(?:Danny\s*Sullivan|DannySullivan)$/i,
  /\s*[-–—]\s*(?:Barry\s*Schwartz|BarrySchwartz)$/i,
  /\s*[-–—]\s*(?:John\s*Mueller|JohnMueller)$/i,
  /\s*[-–—]\s*(?:Gary\s*Illyes|GaryIllyes)$/i,
  /\s*[-–—]\s*(?:Martin\s*Splitt|MartinSplitt)$/i,
  /\s*[-–—]\s*(?:Pete\s*Meyers|PeteMeyers)$/i,
  /\s*[-–—]\s*(?:Dr\.\s*Pete|DrPete)$/i,
  /\s*[-–—]\s*(?:Cyrus\s*Shepard|CyrusShepard)$/i,
  /\s*[-–—]\s*(?:Rand\s*Fishkin|RandFishkin)$/i,
  /\s*[-–—]\s*(?:Aleyda\s*Solis|AleydaSolis)$/i,
  /\s*[-–—]\s*(?:Marie\s*Haynes|MarieHaynes)$/i,
  /\s*[-–—]\s*(?:Glen\s*Allsopp|GlenAllsopp)$/i,
  /\s*[-–—]\s*(?:Matthew\s*Woodward|MatthewWoodward)$/i,
  /\s*[-–—]\s*(?:Authority\s*Hacker|AuthorityHacker)$/i,
  /\s*[-–—]\s*(?:Income\s*School|IncomeSchool)$/i,
  /\s*[-–—]\s*(?:Project\s*24|Project24)$/i,
  /\s*[-–—]\s*(?:Fatstacks|Fat\s*Stacks|FatStacks)$/i,
  /\s*[-–—]\s*(?:Human\s*Proof\s*Designs|HumanProofDesigns)$/i,
  /\s*[-–—]\s*(?:Niche\s*Pursuits|NichePursuits)$/i,
  /\s*[-–—]\s*(?:Spencer\s*Haws|SpencerHaws)$/i,
  /\s*[-–—]\s*(?:Doug\s*Cunnington|DougCunnington)$/i,
  /\s*[-–—]\s*(?:Kyle\s*Douglas|KyleDouglas)$/i,
  /\s*[-–—]\s*(?:Jim\s*Harms|JimHarms)$/i,
  /\s*[-–—]\s*(?:Chris\s*Lee|ChrisLee)$/i,
  /\s*[-–—]\s*(?:Tung\s*Tran|TungTran)$/i,
  /\s*[-–—]\s*(?:Perrin\s*Carrell|PerrinCarrell)$/i,
  /\s*[-–—]\s*(?:Jon\s*Dykstra|JonDykstra)$/i,
  /\s*[-–—]\s*(?:Shaun\s*Marrs|ShaunMarrs)$/i,
  /\s*[-–—]\s*(?:Eddy\s*Ballew|EddyBallew)$/i,
  /\s*[-–—]\s*(?:Ben\s*Adler|BenAdler)$/i,
  /\s*[-–—]\s*(?:Morten\s*Storgaard|MortenStorgaard)$/i,
  /\s*[-–—]\s*(?:Emil\s*Kristensen|EmilKristensen)$/i,
  /\s*[-–—]\s*(?:Sujan\s*Patel|SujanPatel)$/i,
  /\s*[-–—]\s*(?:Eric\s*Siu|EricSiu)$/i,
  /\s*[-–—]\s*(?:Larry\s*Kim|LarryKim)$/i,
  /\s*[-–—]\s*(?:Noah\s*Kagan|NoahKagan)$/i,
  /\s*[-–—]\s*(?:Brian\s*Balfour|BrianBalfour)$/i,
  /\s*[-–—]\s*(?:Hiten\s*Shah|HitenShah)$/i,
  /\s*[-–—]\s*(?:Steli\s*Efti|SteliEfti)$/i,
  /\s*[-–—]\s*(?:Sangram\s*Vajre|SangramVajre)$/i,
  /\s*[-–—]\s*(?:Marcus\s*Sheridan|MarcusSheridan)$/i,
  /\s*[-–—]\s*(?:Ann\s*Handley|AnnHandley)$/i,
  /\s*[-–—]\s*(?:Joe\s*Pulizzi|JoePulizzi)$/i,
  /\s*[-–—]\s*(?:Robert\s*Rose|RobertRose)$/i,
  /\s*[-–—]\s*(?:Jay\s*Baer|JayBaer)$/i,
  /\s*[-–—]\s*(?:Lee\s*Odden|LeeOdden)$/i,
  /\s*[-–—]\s*(?:Arnie\s*Kuen|ArnieKuen)$/i,
  /\s*[-–—]\s*(?:Pam\s*Moore|PamMoore)$/i,
  /\s*[-–—]\s*(?:Michael\s*Stelzner|MichaelStelzner)$/i,
  /\s*[-–—]\s*(?:Mari\s*Smith|MariSmith)$/i,
  /\s*[-–—]\s*(?:Amy\s*Porterfield|AmyPorterfield)$/i,
  /\s*[-–—]\s*(?:Pat\s*Flynn|PatFlynn)$/i,
  /\s*[-–—]\s*(?:John\s*Lee\s*Dumas|JohnLeeDumas)$/i,
  /\s*[-–—]\s*(?:Kate\s*Erickson|KateErickson)$/i,
  /\s*[-–—]\s*(?:Tim\s*Ferriss|TimFerriss)$/i,
  /\s*[-–—]\s*(?:Tony\s*Robbins|TonyRobbins)$/i,
  /\s*[-–—]\s*(?:Brendon\s*Burchard|BrendonBurchard)$/i,
  /\s*[-–—]\s*(?:Dean\s*Graziosi|DeanGraziosi)$/i,
  /\s*[-–—]\s*(?:Russell\s*Brunson|RussellBrunson)$/i,
  /\s*[-–—]\s*(?:Ryan\s*Deiss|RyanDeiss)$/i,
  /\s*[-–—]\s*(?:Digital\s*Marketer|DigitalMarketer)$/i,
  /\s*[-–—]\s*(?:Traffic\s*&\s*Conversion|TrafficConversion)$/i,
  /\s*[-–—]\s*(?:Social\s*Media\s*Examiner|SocialMediaExaminer)$/i,
  /\s*[-–—]\s*(?:Content\s*Marketing\s*Institute|ContentMarketingInstitute)$/i,
  /\s*[-–—]\s*(?:MarketingProfs)$/i,
  /\s*[-–—]\s*(?:Copyblogger)$/i,
  /\s*[-–—]\s*(?:Problogger)$/i,
  /\s*[-–—]\s*(?:Smart\s*Blogger|SmartBlogger)$/i,
  /\s*[-–—]\s*(?:Be\s*a\s*Better\s*Blogger|BeABetterBlogger)$/i,
  /\s*[-–—]\s*(?:Blog\s*Tyrant|BlogTyrant)$/i,
  /\s*[-–—]\s*(?:Blogging\s*Wizard|BloggingWizard)$/i,
  /\s*[-–—]\s*(?:Ryan\s*Robinson|RyanRobinson)$/i,
  /\s*[-–—]\s*(?:Adam\s*Connell|AdamConnell)$/i,
  /\s*[-–—]\s*(?:Jerry\s*Low|JerryLow)$/i,
  /\s*[-–—]\s*(?:ShoutMeLoud)$/i,
  /\s*[-–—]\s*(?:Harsh\s*Agrawal|HarshAgrawal)$/i,
  /\s*[-–—]\s*(?:WPBeginner)$/i,
  /\s*[-–—]\s*(?:Syed\s*Balkhi|SyedBalkhi)$/i,
  /\s*[-–—]\s*(?:Kinsta)$/i,
  /\s*[-–—]\s*(?:WP\s*Engine|WPEngine)$/i,
  /\s*[-–—]\s*(?:Flywheel)$/i,
  /\s*[-–—]\s*(?:SiteGround)$/i,
  /\s*[-–—]\s*(?:Bluehost)$/i,
  /\s*[-–—]\s*(?:HostGator)$/i,
  /\s*[-–—]\s*(?:DreamHost)$/i,
  /\s*[-–—]\s*(?:InMotion\s*Hosting|InMotionHosting)$/i,
  /\s*[-–—]\s*(?:A2\s*Hosting|A2Hosting)$/i,
  /\s*[-–—]\s*(?:GreenGeeks)$/i,
  /\s*[-–—]\s*(?:iPage)$/i,
  /\s*[-–—]\s*(?:JustHost)$/i,
  /\s*[-–—]\s*(?:Hostinger)$/i,
  /\s*[-–—]\s*(?:Namecheap)$/i,
  /\s*[-–—]\s*(?:GoDaddy)$/i,
  /\s*[-–—]\s*(?:Domain\.com|Domaincom)$/i,
  /\s*[-–—]\s*(?:Name\.com|Namecom)$/i,
  /\s*[-–—]\s*(?:Google\s*Domains|GoogleDomains)$/i,
  /\s*[-–—]\s*(?:Cloudflare)$/i,
  /\s*[-–—]\s*(?:Amazon\s*Route\s*53|AmazonRoute53)$/i,
  /\s*[-–—]\s*(?:DNSMadeEasy)$/i,
  /\s*[-–—]\s*(?:Dyn)$/i,
  /\s*[-–—]\s*(?:NS1)$/i,
  /\s*[-–—]\s*(?:Constellix)$/i,
  /\s*[-–—]\s*(?:EasyDNS)$/i,
  /\s*[-–—]\s*(?:Gandi)$/i,
  /\s*[-–—]\s*(?:OVH)$/i,
  /\s*[-–—]\s*(?:Hetzner)$/i,
  /\s*[-–—]\s*(?:Linode)$/i,
  /\s*[-–—]\s*(?:DigitalOcean)$/i,
  /\s*[-–—]\s*(?:Vultr)$/i,
  /\s*[-–—]\s*(?:UpCloud)$/i,
  /\s*[-–—]\s*(?:Scaleway)$/i,
  /\s*[-–—]\s*(?:Exoscale)$/i,
  /\s*[-–—]\s*(::\s*[A-Za-z\s]+)$/i,
];

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

// ─── CLEAN TITLE ─────────────────────────────────────────────────
function cleanTitle(title: string): string {
  let cleaned = title.trim();
  for (const pattern of SOURCE_SUFFIXES) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

// ─── WEBHOOK HANDLER ─────────────────────────────────────────────
async function handleWebhook(supabase: any, req: Request) {
  const body = await req.json();

  if (!body.title || !body.url) {
    return new Response(JSON.stringify({ error: "Missing title or url" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Clean the title (remove source suffixes)
  const cleanedTitle = cleanTitle(body.title);

  // 1. Extract/fetch article content from URL
  const scraped = await fetchArticleContent(body.url);
  let articleContent = body.content || scraped.content || "";
  let articleDescription = body.description || scraped.description || "";
  let coverImage = scraped.coverImage || "";

  // If still no content, use description as fallback
  if (!articleContent || articleContent.length < 50) {
    articleContent = articleDescription;
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
  const keywordSig = generateKeywordSignature(cleanedTitle, articleContent);
  const contentHash = await hashContent(normalizeText(cleanedTitle + " " + articleContent));

  // 4. Check for duplicate by content hash
  const { data: hashDup } = await supabase
    .from("scraped_articles")
    .select("id, dedup_group_id, original_url, original_title, status")
    .eq("content_hash", contentHash)
    .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (hashDup) {
    return await mergeDuplicate(supabase, hashDup, body, cleanedTitle, articleContent, articleDescription, coverImage, keywordSig, contentHash);
  }

  // 5. Check for fuzzy duplicate by keyword signature
  const { data: similarArticles } = await supabase
    .from("scraped_articles")
    .select("id, dedup_group_id, original_url, original_title, keyword_signature, original_content, status")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .not("keyword_signature", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const fuzzyMatch = findFuzzyDuplicate(keywordSig, similarArticles || [], cleanedTitle);

  if (fuzzyMatch) {
    return await mergeDuplicate(supabase, fuzzyMatch, body, cleanedTitle, articleContent, articleDescription, coverImage, keywordSig, contentHash);
  }

  // 6. No duplicate — create new dedup group and insert
  const { data: dedupGroup } = await supabase
    .from("article_dedup_groups")
    .insert({
      canonical_title: cleanedTitle,
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

  // Parse published_at from Make.com payload
  let publishedAt: string | null = null;
  if (body.publishedAt) {
    publishedAt = new Date(body.publishedAt).toISOString();
  }

  const { data: scrapedArticle, error } = await supabase
    .from("scraped_articles")
    .insert({
      source_id: sourceId,
      original_url: body.url,
      original_title: body.title, // Keep original for admin reference
      original_content: articleContent,
      original_excerpt: articleDescription,
      keyword_signature: keywordSig,
      content_hash: contentHash,
      dedup_group_id: dedupGroup?.id,
      status: "pending_ai",
      published_at: publishedAt,
      cover_image_url: coverImage || null,
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
  const aiResult = await processArticleWithAI(supabase, scrapedArticle, dedupGroup?.id, cleanedTitle);

  return new Response(
    JSON.stringify({
      success: true,
      article: scrapedArticle,
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
  cleanedTitle: string,
  articleContent: string,
  articleDescription: string,
  coverImage: string,
  keywordSig: string,
  contentHash: string
) {
  const dedupGroupId = existing.dedup_group_id;

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

  let publishedAt: string | null = null;
  if (body.publishedAt) {
    publishedAt = new Date(body.publishedAt).toISOString();
  }

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
      published_at: publishedAt,
      cover_image_url: coverImage || null,
    })
    .select("*")
    .single();

  await supabase
    .from("article_dedup_groups")
    .update({ updated_at: new Date().toISOString() })
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
async function fetchArticleContent(url: string): Promise<{ content: string; description: string; coverImage: string }> {
  try {
    // Handle Google News RSS redirect URLs
    if (url.includes("news.google.com/rss/articles/")) {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      const finalUrl = response.url;
      if (finalUrl !== url && !finalUrl.includes("news.google.com")) {
        const articleHtml = await response.text();
        return extractFromHtml(articleHtml, finalUrl);
      }
      return { content: "", description: "", coverImage: "" };
    }

    // For direct article URLs
    if (url.startsWith("http")) {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      const articleHtml = await response.text();
      return extractFromHtml(articleHtml, url);
    }
  } catch (err) {
    console.error("Failed to fetch article content:", err);
  }

  return { content: "", description: "", coverImage: "" };
}

function extractFromHtml(html: string, url: string): { content: string; description: string; coverImage: string } {
  // Extract description from meta tags
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
  const description = descMatch ? descMatch[1] : "";

  // Extract cover image from meta tags
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                       html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  let coverImage = ogImageMatch ? ogImageMatch[1] : "";

  // If no og:image, try to find first large image in article
  if (!coverImage) {
    const imgMatch = html.match(/<img[^>]*src=["'](https?:\/\/[^"']+(?:\.(?:jpg|jpeg|png|webp))[^"']*)["'][^>]*>/i);
    if (imgMatch) coverImage = imgMatch[1];
  }

  // Remove scripts, styles, nav, header, footer, aside
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Try to find article content in common containers (Hungarian + international sites)
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*(?:article-content|entry-content|post-content|post-body|story-body|story__body|article__body|content__body|main-content|page-content|text-content|body-content|article-text|news-text|story-text|lead-text|content-text|article__text|story__text|content__text|main__text|page__text|body__text|text__body|text__content|article__content|story__content|content__article|main__article|page__article|body__article|article__main|story__main|content__main|main__story|page__story|body__story|article__page|story__page|content__page|main__page|page__main|body__page|article__entry|story__entry|content__entry|main__entry|page__entry|body__entry|article__post|story__post|content__post|main__post|page__post|body__post|article__news|story__news|content__news|main__news|page__news|body__news|article__story|story__story|content__story|main__story|page__story|body__story|article__article|story__article|content__article|main__article|page__article|body__article|article__lead|story__lead|content__lead|main__lead|page__lead|body__lead|article__detail|story__detail|content__detail|main__detail|page__detail|body__detail|article__full|story__full|content__full|main__full|page__full|body__full|article__main-content|story__main-content|content__main-content|main__main-content|page__main-content|body__main-content|article__body-content|story__body-content|content__body-content|main__body-content|page__body-content|body__body-content|article__text-content|story__text-content|content__text-content|main__text-content|page__text-content|body__text-content|article__article-content|story__article-content|content__article-content|main__article-content|page__article-content|body__article-content|article__post-content|story__post-content|content__post-content|main__post-content|page__post-content|body__post-content|article__entry-content|story__entry-content|content__entry-content|main__entry-content|page__entry-content|body__entry-content|article__page-content|story__page-content|content__page-content|main__page-content|page__page-content|body__page-content|article__story-content|story__story-content|content__story-content|main__story-content|page__story-content|body__story-content|article__news-content|story__news-content|content__news-content|main__news-content|page__news-content|body__news-content|article__lead-content|story__lead-content|content__lead-content|main__lead-content|page__lead-content|body__lead-content|article__detail-content|story__detail-content|content__detail-content|main__detail-content|page__detail-content|body__detail-content|article__full-content|story__full-content|content__full-content|main__full-content|page__full-content|body__full-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["'][^"']*(?:article-content|entry-content|post-content|post-body|story-body|story__body|article__body|content__body|main-content|page-content|text-content|body-content|article-text|news-text|story-text|lead-text|content-text|article__text|story__text|content__text|main__text|page__text|body__text|text__body|text__content|article__content|story__content|content__article|main__article|page__article|body__article|article__main|story__main|content__main|main__story|page__story|body__story|article__page|story__page|content__page|main__page|page__main|body__page|article__entry|story__entry|content__entry|main__entry|page__entry|body__entry|article__post|story__post|content__post|main__post|page__post|body__post|article__news|story__news|content__news|main__news|page__news|body__news|article__story|story__story|content__story|main__story|page__story|body__story|article__article|story__article|content__article|main__article|page__article|body__article|article__lead|story__lead|content__lead|main__lead|page__lead|body__lead|article__detail|story__detail|content__detail|main__detail|page__detail|body__detail|article__full|story__full|content__full|main__full|page__full|body__full|article__main-content|story__main-content|content__main-content|main__main-content|page__main-content|body__main-content|article__body-content|story__body-content|content__body-content|main__body-content|page__body-content|body__body-content|article__text-content|story__text-content|content__text-content|main__text-content|page__text-content|body__text-content|article__article-content|story__article-content|content__article-content|main__article-content|page__article-content|body__article-content|article__post-content|story__post-content|content__post-content|main__post-content|page__post-content|body__post-content|article__entry-content|story__entry-content|content__entry-content|main__entry-content|page__entry-content|body__entry-content|article__page-content|story__page-content|content__page-content|main__page-content|page__page-content|body__page-content|article__story-content|story__story-content|content__story-content|main__story-content|page__story-content|body__story-content|article__news-content|story__news-content|content__news-content|main__news-content|page__news-content|body__news-content|article__lead-content|story__lead-content|content__lead-content|main__lead-content|page__lead-content|body__lead-content|article__detail-content|story__detail-content|content__detail-content|main__detail-content|page__detail-content|body__detail-content|article__full-content|story__full-content|content__full-content|main__full-content|page__full-content|body__full-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class=["'][^"']*(?:article|content|post|story|news|text|body|main|page)[^"']*["'][^>]*>([\s\S]*?)<\/section>/i,
  ];

  let articleContent = "";
  for (const pattern of articlePatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      articleContent = match[1] || match[2] || "";
      break;
    }
  }

  // If no article container found, try to extract all paragraph text
  if (!articleContent) {
    const paragraphs = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (paragraphs) {
      articleContent = paragraphs.slice(0, 30).join("\n");
    }
  }

  // Clean HTML tags from content
  const textContent = articleContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    content: textContent.substring(0, 12000),
    description: description.substring(0, 500),
    coverImage: coverImage,
  };
}

// ─── KEYWORD SIGNATURE ───────────────────────────────────────────
function generateKeywordSignature(title: string, content: string): string {
  const text = normalizeText(title + " " + content);

  const stopWords = new Set([
    "a", "az", "egy", "es", "is", "meg", "nem", "hogy", "van", "volt",
    "lesz", "kell", "mar", "meg", "csak", "mint", "ide", "oda", "itt",
    "ott", "ki", "mi", "o", "ok", "te", "ti", "en", "mier", "hogyan",
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

  const words = text.split(/\s+/);
  const keywords = words
    .filter((w) => w.length >= 4 && !stopWords.has(w))
    .reduce((acc: Record<string, number>, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {});

  const sorted = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w);

  return sorted.join("|");
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F]/g, " ")
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

// ─── SYNONYMS ────────────────────────────────────────────────────
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

// ─── FUZZY DUPLICATE DETECTION ───────────────────────────────────
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
    const candKeywords = new Set(
      (candidate.keyword_signature || "").split("|").map(normalizeWithSynonyms)
    );
    const keywordOverlap = [...newKeywords].filter((k) => candKeywords.has(k)).length;
    const keywordUnion = new Set([...newKeywords, ...candKeywords]).size;
    const keywordSimilarity = keywordUnion > 0 ? keywordOverlap / keywordUnion : 0;

    const candTitleWords = new Set(
      normalizeText(candidate.original_title)
        .split(/\s+/)
        .filter((w: string) => w.length >= 4)
        .map(normalizeWithSynonyms)
    );
    const titleOverlap = [...newTitleWords].filter((w) => candTitleWords.has(w)).length;
    const titleUnion = new Set([...newTitleWords, ...candTitleWords]).size;
    const titleSimilarity = titleUnion > 0 ? titleOverlap / titleUnion : 0;

    const sharedImportant = [...newKeywords].filter((k) => {
      const importantTerms = ["dvsc", "debrecen", "loki", "francia", "csatar", "tamado", "igazolas", "szerzodtetes", "igazolt", "szerzodtetett"];
      return importantTerms.includes(k) && candKeywords.has(k);
    }).length;

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
    const cleanedTitle = cleanTitle(article.original_title);
    const result = await processArticleWithAI(supabase, article, article.dedup_group_id, cleanedTitle);
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

async function processArticleWithAI(
  supabase: any,
  article: any,
  dedupGroupId: string | null,
  cleanedTitle: string
) {
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

  // Gather all related source content
  let combinedContent = article.original_content || "";
  let combinedTitle = cleanedTitle;
  let combinedCover = article.cover_image_url || "";

  if (dedupGroupId) {
    const { data: relatedArticles } = await supabase
      .from("scraped_articles")
      .select("original_title, original_content, original_url, is_duplicate, cover_image_url")
      .eq("dedup_group_id", dedupGroupId)
      .neq("id", article.id);

    if (relatedArticles && relatedArticles.length > 0) {
      for (const related of relatedArticles) {
        if (related.original_content && related.original_content.length > combinedContent.length) {
          combinedContent = related.original_content;
        }
        if (related.cover_image_url && !combinedCover) {
          combinedCover = related.cover_image_url;
        }
      }
    }
  }

  if (!openRouterKey) {
    const { data: draft } = await supabase
      .from("ai_drafts")
      .insert({
        scraped_article_id: article.id,
        draft_type: "article",
        generated_content: combinedContent || article.original_content,
        suggested_headline: combinedTitle,
        status: "pending_review",
        review_status: "pending",
        dedup_group_id: dedupGroupId,
        published_at: article.published_at,
        cover_image_url: combinedCover || DEFAULT_COVER_IMAGE,
      })
      .select("id")
      .single();

    await supabase
      .from("scraped_articles")
      .update({ status: "pending_review", ai_draft_id: draft?.id })
      .eq("id", article.id);

    return { article_id: article.id, status: "pending_review", ai: false };
  }

  const prompt = `You are a professional sports journalist writing for DVSC (Debreceni Vasutas Sport Club) fan website.

Original article title: "${combinedTitle}"
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
        headline: combinedTitle,
        excerpt: article.original_excerpt,
        content: aiContent,
        category: "General",
        seo_title: combinedTitle,
        meta_description: article.original_excerpt,
      };
    }

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
        suggested_headline: parsed.headline || combinedTitle,
        seo_title: parsed.seo_title || parsed.headline || combinedTitle,
        meta_description: parsed.meta_description || parsed.excerpt || article.original_excerpt,
        ai_summary: parsed.excerpt || article.original_excerpt,
        image_suggestion: "football stadium match",
        status: "pending_review",
        review_status: "pending",
        dedup_group_id: dedupGroupId,
        related_sources: relatedSources.length > 0 ? relatedSources : [],
        source_info: { original_url: article.original_url, source: article.source_id },
        published_at: article.published_at,
        cover_image_url: combinedCover || DEFAULT_COVER_IMAGE,
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
        suggested_headline: combinedTitle,
        status: "pending_review",
        review_status: "pending",
        dedup_group_id: dedupGroupId,
        published_at: article.published_at,
        cover_image_url: combinedCover || DEFAULT_COVER_IMAGE,
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
