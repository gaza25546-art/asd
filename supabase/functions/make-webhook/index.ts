import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Webhook-Secret",
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

    const body = await req.json();
    const actionType = body.action_type;
    const payload = body.payload || {};
    const webhookSecret = req.headers.get("X-Webhook-Secret");

    // Verify webhook secret if provided in headers
    if (webhookSecret) {
      const { data: webhook } = await supabase
        .from("automation_webhooks")
        .select("secret, is_active")
        .eq("action_type", actionType)
        .eq("is_active", true)
        .maybeSingle();

      if (webhook && webhook.secret && webhook.secret !== webhookSecret) {
        await logAction(supabase, actionType, "unauthorized", "Invalid webhook secret");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let result: any = { success: true };

    switch (actionType) {
      case "publish_news": {
        const slug = payload.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `article-${Date.now()}`;
        const { data, error } = await supabase.from("news_articles").insert({
          title: payload.title,
          slug,
          excerpt: payload.excerpt || "",
          content: payload.content || "",
          image_url: payload.image_url || "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg",
          category: payload.category || "General",
          author: payload.author || "Make.com Automation",
          status: payload.status || "published",
          source_info: payload.source_info || null,
        }).select("id").single();
        if (error) throw new Error(error.message);
        result = { article_id: data?.id };
        break;
      }

      case "update_fixtures": {
        if (payload.fixture_id) {
          const { error } = await supabase.from("fixtures").update({
            status: payload.status,
            dvsc_score: payload.dvsc_score,
            opponent_score: payload.opponent_score,
          }).eq("id", payload.fixture_id);
          if (error) throw new Error(error.message);
          result = { updated: payload.fixture_id };
        } else {
          const { data, error } = await supabase.from("fixtures").insert({
            competition: payload.competition,
            opponent: payload.opponent,
            home_away: payload.home_away || "home",
            match_date: payload.match_date,
            venue: payload.venue,
            status: payload.status || "scheduled",
          }).select("id").single();
          if (error) throw new Error(error.message);
          result = { fixture_id: data?.id };
        }
        break;
      }

      case "update_standings": {
        // Standings are static in this app, but we log the action
        result = { message: "Standings update received and logged" };
        break;
      }

      case "transfer_news": {
        const slug = payload.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `transfer-${Date.now()}`;
        const { data, error } = await supabase.from("news_articles").insert({
          title: payload.title,
          slug,
          excerpt: payload.excerpt || "",
          content: payload.content || "",
          image_url: payload.image_url || "https://images.pexels.com/photos/258700/pexels-photo-258700.jpeg",
          category: "Transfers",
          author: payload.author || "Transfer Desk",
          status: "published",
        }).select("id").single();
        if (error) throw new Error(error.message);
        result = { article_id: data?.id };
        break;
      }

      case "push_notification": {
        // Insert notifications for users with the preference enabled
        const notifType = payload.type || "breaking_news";
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("user_id")
          .eq(notifType, true);

        if (prefs && prefs.length > 0) {
          const notifications = prefs.map((p) => ({
            user_id: p.user_id,
            type: notifType,
            title: payload.title,
            message: payload.message,
            link: payload.link || null,
          }));
          const { error } = await supabase.from("notifications").insert(notifications);
          if (error) throw new Error(error.message);
          result = { sent_to: prefs.length };
        } else {
          result = { sent_to: 0, message: "No users with this preference" };
        }
        break;
      }

      case "send_newsletter": {
        const { data: subs } = await supabase
          .from("newsletter_subscribers")
          .select("email");

        if (payload.campaign_id) {
          await supabase.from("newsletter_campaigns").update({
            status: "sent",
            sent_at: new Date().toISOString(),
            sent_count: subs?.length || 0,
          }).eq("id", payload.campaign_id);
        }

        result = { subscriber_count: subs?.length || 0, message: "Newsletter campaign marked as sent" };
        break;
      }

      case "moderate_content": {
        if (payload.content_type === "comment" && payload.comment_id) {
          const { error } = await supabase.from("comments")
            .update({ is_hidden: payload.action === "hide" })
            .eq("id", payload.comment_id);
          if (error) throw new Error(error.message);
          result = { moderated: payload.comment_id, action: payload.action };
        } else if (payload.content_type === "forum_topic" && payload.topic_id) {
          const { error } = await supabase.from("forum_topics")
            .update({ is_hidden: payload.action === "hide", is_locked: payload.action === "lock" })
            .eq("id", payload.topic_id);
          if (error) throw new Error(error.message);
          result = { moderated: payload.topic_id, action: payload.action };
        }
        break;
      }

      default:
        result = { message: `Unknown action: ${actionType}` };
    }

    await logAction(supabase, actionType, "success", JSON.stringify(result), payload);

    return new Response(JSON.stringify({ success: true, ...result }), {
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

async function logAction(supabase: any, actionType: string, status: string, message?: string, payload?: any) {
  await supabase.from("automation_logs").insert({
    action_type: actionType,
    source: "make.com",
    status,
    message: message || null,
    payload: payload || null,
  });
}
