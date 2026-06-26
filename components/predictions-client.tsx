'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Target, Trophy, Calendar, Check } from 'lucide-react';
import Link from 'next/link';

interface Fixture {
  id: string;
  opponent: string;
  match_date: string;
  competition: string;
  home_away: string;
  status: string;
  dvsc_score: number | null;
  opponent_score: number | null;
}

interface Prediction {
  id: string;
  fixture_id: string;
  predicted_dvsc_score: number;
  predicted_opponent_score: number;
  first_goalscorer: string | null;
  man_of_match: string | null;
}

export function PredictionsClient() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, { dvsc: number; opp: number }>>({});
  const [scorers, setScorers] = useState<Record<string, string>>({});
  const [motm, setMotm] = useState<Record<string, string>>({});
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: fix } = await supabase
      .from('fixtures')
      .select('*')
      .order('match_date', { ascending: true });
    setFixtures((fix as Fixture[]) ?? []);

    const { data: squad } = await supabase
      .from('squad_players')
      .select('id, name')
      .order('name');
    setPlayers(squad ?? []);

    if (user) {
      const { data: preds } = await supabase
        .from('match_predictions')
        .select('id, fixture_id, predicted_dvsc_score, predicted_opponent_score, first_goalscorer, man_of_match')
        .eq('user_id', user.id);
      setPredictions((preds as Prediction[]) ?? []);
      const scoreMap: Record<string, { dvsc: number; opp: number }> = {};
      const scorerMap: Record<string, string> = {};
      const motmMap: Record<string, string> = {};
      (preds as Prediction[])?.forEach((p) => {
        scoreMap[p.fixture_id] = { dvsc: p.predicted_dvsc_score, opp: p.predicted_opponent_score };
        if (p.first_goalscorer) scorerMap[p.fixture_id] = p.first_goalscorer;
        if (p.man_of_match) motmMap[p.fixture_id] = p.man_of_match;
      });
      setScores(scoreMap);
      setScorers(scorerMap);
      setMotm(motmMap);
    }
    setLoading(false);
  };

  const handlePredict = async (fixtureId: string) => {
    if (!user) {
      toast.error('Please sign in to make predictions.');
      return;
    }
    const pred = scores[fixtureId];
    if (pred === undefined) return;

    const existing = predictions.find((p) => p.fixture_id === fixtureId);
    const extra = {
      first_goalscorer: scorers[fixtureId] || null,
      man_of_match: motm[fixtureId] || null,
    };
    if (existing) {
      const { error } = await supabase
        .from('match_predictions')
        .update({ predicted_dvsc_score: pred.dvsc, predicted_opponent_score: pred.opp, ...extra })
        .eq('id', existing.id);
      if (error) toast.error('Failed to update prediction.');
      else toast.success('Prediction updated!');
    } else {
      const { error } = await supabase
        .from('match_predictions')
        .insert({ fixture_id: fixtureId, predicted_dvsc_score: pred.dvsc, predicted_opponent_score: pred.opp, ...extra });
      if (error) toast.error('Failed to save prediction.');
      else toast.success('Prediction saved!');
    }
    loadData();
  };

  const setScore = (fixtureId: string, team: 'dvsc' | 'opp', value: number) => {
    setScores((prev) => ({
      ...prev,
      [fixtureId]: {
        dvsc: team === 'dvsc' ? value : prev[fixtureId]?.dvsc ?? 0,
        opp: team === 'opp' ? value : prev[fixtureId]?.opp ?? 0,
      },
    }));
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading predictions...</p>;
  }

  const upcoming = fixtures.filter((f) => f.status === 'scheduled');
  const completed = fixtures.filter((f) => f.status === 'finished');

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Match Prediction Game</h1>
            <p className="text-muted-foreground">Predict scores, scorers, and MOTM. Compete with fellow fans!</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/leaderboard"><Trophy className="mr-2 h-4 w-4" /> Leaderboard</Link>
          </Button>
        </div>
      </div>

      {!user && (
        <Card className="mb-6 p-6 text-center glass border-border/40">
          <Target className="mx-auto mb-3 h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to start making predictions and track your accuracy!
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </Card>
      )}

      {/* Upcoming Predictions */}
      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" /> Upcoming Matches
      </h2>
      <div className="space-y-4 mb-12">
        {upcoming.map((fixture) => {
          const pred = predictions.find((p) => p.fixture_id === fixture.id);
          const currentScore = scores[fixture.id] ?? { dvsc: pred?.predicted_dvsc_score ?? 0, opp: pred?.predicted_opponent_score ?? 0 };
          return (
            <Card key={fixture.id} className="p-5 border-border/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 text-[10px]">{fixture.competition}</Badge>
                  <p className="font-display text-lg font-bold">DVSC vs {fixture.opponent}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(fixture.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">DVSC</span>
                    <ScoreInput value={currentScore.dvsc} onChange={(v) => setScore(fixture.id, 'dvsc', v)} />
                  </div>
                  <span className="text-muted-foreground">-</span>
                  <div className="flex items-center gap-2">
                    <ScoreInput value={currentScore.opp} onChange={(v) => setScore(fixture.id, 'opp', v)} />
                    <span className="text-sm font-medium">{fixture.opponent.slice(0, 3).toUpperCase()}</span>
                  </div>
                  <Button size="sm" onClick={() => handlePredict(fixture.id)} disabled={!user}>
                    {pred ? <Check className="h-4 w-4" /> : 'Predict'}
                  </Button>
                </div>
              </div>
              {user && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border/20 pt-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">First Goalscorer</label>
                    <select
                      value={scorers[fixture.id] || ''}
                      onChange={(e) => setScorers({ ...scorers, [fixture.id]: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select player...</option>
                      {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Man of the Match</label>
                    <select
                      value={motm[fixture.id] || ''}
                      onChange={(e) => setMotm({ ...motm, [fixture.id]: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select player...</option>
                      {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {pred && (
                <p className="mt-3 text-xs text-green-500 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Prediction saved: {pred.predicted_dvsc_score} - {pred.predicted_opponent_score}
                  {pred.first_goalscorer && ` | Scorer: ${pred.first_goalscorer}`}
                </p>
              )}
            </Card>
          );
        })}
        {upcoming.length === 0 && <p className="text-muted-foreground text-sm">No upcoming matches to predict.</p>}
      </div>

      {/* Results & Accuracy */}
      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" /> Results & Accuracy
      </h2>
      <div className="space-y-3">
        {completed.map((fixture) => {
          const pred = predictions.find((p) => p.fixture_id === fixture.id);
          const actualDvsc = fixture.dvsc_score ?? 0;
          const actualOpp = fixture.opponent_score ?? 0;
          const correct = pred && pred.predicted_dvsc_score === actualDvsc && pred.predicted_opponent_score === actualOpp;
          const correctResult = pred &&
            Math.sign(pred.predicted_dvsc_score - pred.predicted_opponent_score) === Math.sign(actualDvsc - actualOpp);

          return (
            <Card key={fixture.id} className="p-4 border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">DVSC vs {fixture.opponent}</p>
                  <p className="text-xs text-muted-foreground">{fixture.competition}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Actual</p>
                    <p className="font-display text-lg font-bold">{actualDvsc} - {actualOpp}</p>
                  </div>
                  {pred ? (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Your Pick</p>
                      <p className="font-display text-lg font-bold">{pred.predicted_dvsc_score} - {pred.predicted_opponent_score}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No prediction</p>
                  )}
                  {pred && (
                    <Badge variant={correct ? 'default' : correctResult ? 'secondary' : 'destructive'}>
                      {correct ? 'Perfect!' : correctResult ? 'Result' : 'Miss'}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      className="h-10 w-12 rounded-md border border-input bg-background text-center font-display text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
