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

    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    let identifier = ip;
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        identifier = user.id;
      }
    }

    const body = await req.json().catch(() => ({}));
    const endpoint = body.endpoint || "default";
    const limit = body.limit || 60;
    const windowSeconds = body.window_seconds || 60;

    const windowKey = `${identifier}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const { data: recent } = await supabase
      .from("automation_logs")
      .select("id, created_at")
      .ilike("action_type", `rate_limit:%`)
      .filter("payload->>window_key", "eq", windowKey)
      .gte("created_at", new Date(windowStart).toISOString())
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    const requestCount = recent?.length ?? 0;

    if (requestCount >= limit) {
      await supabase.from("automation_logs").insert({
        action_type: "rate_limit:blocked",
        source: "rate-limit",
        status: "blocked",
        message: `Rate limit exceeded for ${identifier} on ${endpoint}`,
        payload: { window_key: windowKey, count: requestCount, limit, user_id: userId },
      });

      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          limit,
          reset_at: new Date(now + windowSeconds * 1000).toISOString(),
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(windowSeconds),
          },
        }
      );
    }

    await supabase.from("automation_logs").insert({
      action_type: "rate_limit:check",
      source: "rate-limit",
      status: "success",
      payload: { window_key: windowKey, endpoint, user_id: userId },
    });

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: limit - requestCount - 1,
        limit,
        reset_at: new Date(now + windowSeconds * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
