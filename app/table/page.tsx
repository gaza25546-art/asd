import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';
import { SyncButton } from '@/components/sync-button';

export const metadata = { title: 'League Table | DVSC' };

export default async function TablePage() {
  const { data: standings } = await supabase
    .from('league_standings')
    .select('*')
    .order('position', { ascending: true });

  const season = standings?.[0]?.season || '2025-2026';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="League Table" subtitle={`Nemzeti Bajnoksag I - ${season} Season`} />
        <SyncButton entity="standings" />
      </div>

      <Card className="overflow-hidden border-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-card/50">
                <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Team</th>
                <th className="px-3 py-3 text-center font-display text-xs uppercase text-muted-foreground">P</th>
                <th className="px-3 py-3 text-center font-display text-xs uppercase text-muted-foreground hidden sm:table-cell">W</th>
                <th className="px-3 py-3 text-center font-display text-xs uppercase text-muted-foreground hidden sm:table-cell">D</th>
                <th className="px-3 py-3 text-center font-display text-xs uppercase text-muted-foreground hidden sm:table-cell">L</th>
                <th className="px-3 py-3 text-center font-display text-xs uppercase text-muted-foreground">GD</th>
                <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-primary">Pts</th>
              </tr>
            </thead>
            <tbody>
              {(standings ?? []).map((row) => {
                const isDVSC = row.team_name === 'Debrecen';
                const isTop3 = row.position <= 3;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-border/20 transition-colors hover:bg-muted/50 ${
                      isDVSC ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isTop3 && <Trophy className="h-3 w-3 text-primary" />}
                        <span className="font-bold">{row.position}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.team_badge_url && (
                          <img
                            src={row.team_badge_url}
                            alt={row.team_name}
                            className="h-6 w-6 object-contain"
                            loading="lazy"
                          />
                        )}
                        <span className={`font-medium ${isDVSC ? 'text-primary font-bold' : ''}`}>
                          {row.team_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{row.played}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">{row.won}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">{row.drawn}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">{row.lost}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-display font-bold text-primary">{row.points}</span>
                    </td>
                  </tr>
                );
              })}
              {(!standings || standings.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No standings data available. Click Sync to fetch live data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-primary" /> Champions League Qualification</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/30" /> DVSC</span>
      </div>
    </div>
  );
}
