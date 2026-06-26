import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
const DVSC_TEAM_ID = "133945";
const LEAGUE_ID = "4690";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check auth for admin-only sync
    const authHeader = req.headers.get("Authorization");
    let isAdmin = false;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile && ["editor", "super_admin"].includes(profile.role)) {
          isAdmin = true;
        }
      }
    }

    const url = new URL(req.url);
    const entity = url.searchParams.get("entity") || "all";

    const results: Record<string, any> = {};

    if (entity === "all" || entity === "fixtures") {
      results.fixtures = await syncFixtures(supabase);
    }
    if (entity === "all" || entity === "standings") {
      results.standings = await syncStandings(supabase);
    }
    if (entity === "all" || entity === "squad") {
      results.squad = await syncSquad(supabase);
    }

    return new Response(JSON.stringify({
      success: true,
      synced: results,
      timestamp: new Date().toISOString(),
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

async function syncFixtures(supabase: any) {
  // Fetch last (completed) and next (upcoming) events
  const [lastRes, nextRes] = await Promise.all([
    fetch(`${THESPORTSDB_BASE}/eventslast.php?id=${DVSC_TEAM_ID}`),
    fetch(`${THESPORTSDB_BASE}/eventsnext.php?id=${DVSC_TEAM_ID}`),
  ]);

  const lastData = await lastRes.json();
  const nextData = await nextRes.json();

  const allEvents: any[] = [];
  if (lastData.results) allEvents.push(...lastData.results);
  if (nextData.events) allEvents.push(...nextData.events);

  let synced = 0;

  for (const event of allEvents) {
    const isHome = event.strHomeTeam === "Debrecen";
    const opponent = isHome ? event.strAwayTeam : event.strHomeTeam;
    const opponentBadge = isHome ? event.strAwayTeamBadge : event.strHomeTeamBadge;
    const venue = event.strVenue || "Nagyerdei Stadion";
    const status = event.strStatus === "FT" ? "finished" : event.strStatus === "NS" ? "scheduled" : "scheduled";
    const dvscScore = status === "finished" ? (isHome ? parseInt(event.intHomeScore || "0") : parseInt(event.intAwayScore || "0")) : null;
    const oppScore = status === "finished" ? (isHome ? parseInt(event.intAwayScore || "0") : parseInt(event.intHomeScore || "0")) : null;
    const matchDate = new Date(event.strTimestamp || `${event.dateEvent}T${event.strTime}`);

    // Check if fixture already exists by api_event_id
    const { data: existing } = await supabase
      .from("fixtures")
      .select("id")
      .eq("api_event_id", event.idEvent)
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabase.from("fixtures").update({
        competition: event.strLeague || "Hungarian NB I",
        opponent,
        home_away: isHome ? "home" : "away",
        match_date: matchDate.toISOString(),
        venue,
        status,
        dvsc_score: dvscScore,
        opponent_score: oppScore,
        opponent_badge_url: opponentBadge,
        api_synced_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      // Insert new
      await supabase.from("fixtures").insert({
        api_event_id: event.idEvent,
        competition: event.strLeague || "Hungarian NB I",
        opponent,
        home_away: isHome ? "home" : "away",
        match_date: matchDate.toISOString(),
        venue,
        status,
        dvsc_score: dvscScore,
        opponent_score: oppScore,
        opponent_badge_url: opponentBadge,
        api_synced_at: new Date().toISOString(),
      });
    }
    synced++;
  }

  await updateSyncMeta(supabase, "thesportsdb", "fixtures", synced);
  return { count: synced };
}

async function syncStandings(supabase: any) {
  // Try current season first, then fallback
  const seasons = ["2025-2026", "2026-2027"];
  let tableData: any[] = [];

  for (const season of seasons) {
    const res = await fetch(`${THESPORTSDB_BASE}/lookuptable.php?l=${LEAGUE_ID}&s=${season}`);
    const data = await res.json();
    if (data.table && data.table.length > 0) {
      tableData = data.table;
      break;
    }
  }

  if (tableData.length === 0) {
    return { count: 0, message: "No standings data available" };
  }

  let synced = 0;

  // Clear old standings for this season
  const season = tableData[0]?.strSeason || "2025-2026";
  await supabase.from("league_standings").delete().eq("season", season);

  for (const row of tableData) {
    await supabase.from("league_standings").insert({
      api_standing_id: row.idStanding,
      team_id: row.idTeam,
      team_name: row.strTeam,
      team_badge_url: row.strBadge?.replace("/tiny", ""),
      position: parseInt(row.intRank),
      played: parseInt(row.intPlayed),
      won: parseInt(row.intWin),
      drawn: parseInt(row.intDraw),
      lost: parseInt(row.intLoss),
      goals_for: parseInt(row.intGoalsFor),
      goals_against: parseInt(row.intGoalsAgainst),
      goal_difference: parseInt(row.intGoalDifference),
      points: parseInt(row.intPoints),
      form: row.strForm,
      description: row.strDescription,
      season: row.strSeason,
      synced_at: new Date().toISOString(),
    });
    synced++;
  }

  await updateSyncMeta(supabase, "thesportsdb", "standings", synced);
  return { count: synced, season };
}

async function syncSquad(supabase: any) {
  const res = await fetch(`${THESPORTSDB_BASE}/lookup_all_players.php?id=${DVSC_TEAM_ID}`);
  const data = await res.json();

  if (!data.player || data.player.length === 0) {
    return { count: 0, message: "No squad data available" };
  }

  let synced = 0;

  for (const player of data.player) {
    // Try to find existing player by api_player_id or name
    const { data: existing } = await supabase
      .from("squad_players")
      .select("id")
      .or(`api_player_id.eq.${player.idPlayer},name.eq.${player.strPlayer}`)
      .maybeSingle();

    const playerData = {
      api_player_id: player.idPlayer,
      name: player.strPlayer,
      position: player.strPosition || "Unknown",
      nationality: player.strNationality,
      birth_date: player.dateBorn,
      height: player.strHeight,
      weight: player.strWeight,
      player_image_url: player.strThumb || player.strCutout || null,
      api_synced_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from("squad_players").update(playerData).eq("id", existing.id);
    } else {
      await supabase.from("squad_players").insert({
        ...playerData,
        appearances: 0,
        goals: 0,
        assists: 0,
      });
    }
    synced++;
  }

  await updateSyncMeta(supabase, "thesportsdb", "squad", synced);
  return { count: synced };
}

async function updateSyncMeta(supabase: any, source: string, entityType: string, records: number) {
  const { data: existing } = await supabase
    .from("api_sync_metadata")
    .select("id")
    .eq("source", source)
    .eq("entity_type", entityType)
    .maybeSingle();

  const meta = {
    source,
    entity_type: entityType,
    last_synced_at: new Date().toISOString(),
    sync_status: "success",
    records_synced: records,
  };

  if (existing) {
    await supabase.from("api_sync_metadata").update(meta).eq("id", existing.id);
  } else {
    await supabase.from("api_sync_metadata").insert(meta);
  }
}
