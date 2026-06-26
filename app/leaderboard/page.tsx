import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Crown, Star } from 'lucide-react';

export const metadata = { title: 'Leaderboard | DVSC' };

export default async function LeaderboardPage() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, prediction_score, forum_reputation')
    .order('prediction_score', { ascending: false })
    .limit(50);

  const { data: badges } = await supabase
    .from('achievement_badges')
    .select('*');

  const ranked = (profiles ?? []).map((p, i) => ({ ...p, rank: i + 1 }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8">
      <SectionHeader title="Prediction Leaderboard" subtitle="Top DVSC predictors and fan achievements" />

      {/* Top 3 */}
      {ranked.length >= 3 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[1, 0, 2].map((idx) => {
            const user = ranked[idx];
            const colors = ['bg-amber-500/20 text-amber-500', 'bg-slate-400/20 text-slate-400', 'bg-orange-700/20 text-orange-700'];
            const icons = [Crown, Medal, Medal];
            const Icon = icons[idx];
            return (
              <Card key={user.id} className={`p-6 text-center border-border/40 ${idx === 0 ? 'scale-105' : ''}`}>
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${colors[idx]}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <p className="font-display text-lg font-bold truncate">{user.display_name}</p>
                <p className="font-display text-2xl font-bold text-primary mt-1">{user.prediction_score}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="overflow-hidden border-border/40">
        <div className="divide-y divide-border/20">
          {ranked.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full font-display font-bold text-sm ${
                  user.rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {user.rank}
                </span>
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {user.forum_reputation} rep</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-bold text-primary">{user.prediction_score}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}
          {ranked.length === 0 && <p className="p-6 text-sm text-muted-foreground">No predictions made yet. Be the first!</p>}
        </div>
      </Card>

      {/* Achievement Badges */}
      {badges && badges.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Achievement Badges
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {badges.map((badge) => (
              <Card key={badge.id} className="p-4 text-center border-border/40">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Trophy className="h-6 w-6" />
                </div>
                <p className="font-display text-sm font-bold">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                <Badge variant="outline" className="mt-2 text-[10px]">{badge.requirement}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
