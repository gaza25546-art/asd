import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Clock } from 'lucide-react';

export const metadata = { title: 'Fixtures & Results | DVSC' };

export default async function FixturesPage() {
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .order('match_date', { ascending: false });

  const upcoming = (fixtures ?? []).filter((f) => f.status === 'scheduled').reverse();
  const completed = (fixtures ?? []).filter((f) => f.status === 'finished');

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 lg:px-8">
      <SectionHeader title="Fixtures & Results" subtitle="Match schedule and scores" />

      {/* Upcoming */}
      <div className="mb-12">
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> Upcoming Fixtures
        </h2>
        <div className="space-y-3">
          {upcoming.map((match) => (
            <Card key={match.id} className="flex flex-col gap-4 p-5 border-border/40 hover:border-primary/30 transition-colors sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="text-xs font-bold uppercase">{new Date(match.match_date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  <span className="font-display text-lg font-bold leading-none">{new Date(match.match_date).getDate()}</span>
                </div>
                <div>
                  <p className="font-display text-lg font-bold">
                    DVSC <span className="text-muted-foreground text-sm font-normal">vs</span> {match.opponent}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <Badge variant="outline">{match.competition}</Badge>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(match.match_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">{match.home_away === 'home' ? 'Home' : 'Away'}</Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> Recent Results
        </h2>
        <div className="space-y-3">
          {completed.map((match) => {
            const won = match.dvsc_score! > match.opponent_score!;
            const lost = match.dvsc_score! < match.opponent_score!;
            return (
              <Card key={match.id} className="flex flex-col gap-4 p-5 border-border/40 hover:border-primary/30 transition-colors sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-display font-bold text-lg ${
                    won ? 'bg-green-500/20 text-green-500' : lost ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    {won ? 'W' : lost ? 'L' : 'D'}
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold">
                      DVSC vs {match.opponent}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline">{match.competition}</Badge>
                      <span>{new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl font-bold">
                    {match.dvsc_score} <span className="text-muted-foreground">-</span> {match.opponent_score}
                  </p>
                  <Badge variant="secondary" className="mt-1">{match.home_away === 'home' ? 'Home' : 'Away'}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
