import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';

export const metadata = { title: 'League Table | DVSC' };

// Static league table data (NB I 2026 season)
const tableData = [
  { pos: 1, team: 'Ferencvaros', p: 30, w: 22, d: 5, l: 3, gd: 45, pts: 71 },
  { pos: 2, team: 'Paks', p: 30, w: 18, d: 6, l: 6, gd: 28, pts: 60 },
  { pos: 3, 'DVSC': true, team: 'Debreceni VSC', p: 30, w: 17, d: 7, l: 6, gd: 25, pts: 58 },
  { pos: 4, team: 'Puskas Akademia', p: 30, w: 15, d: 8, l: 7, gd: 18, pts: 53 },
  { pos: 5, team: 'MTK Budapest', p: 30, w: 14, d: 6, l: 10, gd: 10, pts: 48 },
  { pos: 6, team: 'Zalaegerszeg', p: 30, w: 12, d: 7, l: 11, gd: 5, pts: 43 },
  { pos: 7, team: 'Kecskemet', p: 30, w: 11, d: 8, l: 11, gd: 2, pts: 41 },
  { pos: 8, team: 'Kisvarda', p: 30, w: 10, d: 8, l: 12, gd: -3, pts: 38 },
  { pos: 9, team: 'Honved', p: 30, w: 9, d: 8, l: 13, gd: -8, pts: 35 },
  { pos: 10, team: 'Vasas', p: 30, w: 8, d: 7, l: 15, gd: -15, pts: 31 },
  { pos: 11, team: 'Ujpest', p: 30, w: 7, d: 6, l: 17, gd: -22, pts: 27 },
  { pos: 12, team: 'Nyiregyhaza', p: 30, w: 5, d: 5, l: 20, gd: -35, pts: 20 },
];

export default function TablePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 lg:px-8">
      <SectionHeader title="League Table" subtitle="Nemzeti Bajnoksag I - 2025/26 Season" />

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
              {tableData.map((row) => {
                const isDVSC = (row as any).DVSC;
                const isTop3 = row.pos <= 3;
                return (
                  <tr
                    key={row.pos}
                    className={`border-b border-border/20 transition-colors hover:bg-muted/50 ${
                      isDVSC ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isTop3 && <Trophy className="h-3 w-3 text-primary" />}
                        <span className="font-bold">{row.pos}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isDVSC ? 'text-primary font-bold' : ''}`}>
                        {row.team}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{row.p}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">{row.w}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">{row.d}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground hidden sm:table-cell">{row.l}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-display font-bold text-primary">{row.pts}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-primary" /> Champions League</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/30" /> DVSC</span>
      </div>
    </div>
  );
}
