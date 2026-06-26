'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import { Plus, CreditCard as Edit, Trash2, X, Check, Calendar, RefreshCw } from 'lucide-react';

interface Fixture {
  id: string;
  competition: string;
  opponent: string;
  home_away: string;
  match_date: string;
  venue: string;
  status: string;
  dvsc_score: number | null;
  opponent_score: number | null;
  api_event_id?: string;
  opponent_badge_url?: string;
}

export default function AdminMatchesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Fixture | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Fixture>>({});
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadFixtures(); }, []);

  const loadFixtures = async () => {
    setLoading(true);
    const { data } = await supabase.from('fixtures').select('*').order('match_date', { ascending: false });
    setFixtures((data as Fixture[]) ?? []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.opponent || !form.match_date) { toast.error('Fill required fields.'); return; }
    if (editing) {
      const { error } = await supabase.from('fixtures').update(form).eq('id', editing.id);
      if (error) toast.error('Failed to update.');
      else { toast.success('Fixture updated!'); logAdminAction('update_fixture', 'fixtures', editing.id); setEditing(null); loadFixtures(); }
    } else {
      const { error } = await supabase.from('fixtures').insert({ ...form, status: form.status || 'scheduled' });
      if (error) toast.error('Failed to create.');
      else { toast.success('Fixture created!'); logAdminAction('create_fixture', 'fixtures'); setCreating(false); loadFixtures(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fixture?')) return;
    await supabase.from('fixtures').delete().eq('id', id);
    toast.success('Deleted.'); logAdminAction('delete_fixture', 'fixtures', id); loadFixtures();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync-thesportsdb?entity=fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sync failed');
      toast.success(`Synced ${data.synced.fixtures.count} fixtures from TheSportsDB!`);
      loadFixtures();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync');
    }
    setSyncing(false);
  };

  if (editing || creating) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{editing ? 'Edit Fixture' : 'New Fixture'}</h1>
          <Button variant="ghost" onClick={() => { setEditing(null); setCreating(false); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
        </div>
        <Card className="p-6 border-border/40">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Competition</Label><Input value={form.competition || ''} onChange={(e) => setForm({ ...form, competition: e.target.value })} /></div>
              <div><Label>Opponent</Label><Input value={form.opponent || ''} onChange={(e) => setForm({ ...form, opponent: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Home/Away</Label>
                <select value={form.home_away || 'home'} onChange={(e) => setForm({ ...form, home_away: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="home">Home</option><option value="away">Away</option>
                </select>
              </div>
              <div><Label>Venue</Label><Input value={form.venue || ''} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
            </div>
            <div><Label>Match Date</Label><Input type="datetime-local" value={form.match_date ? new Date(form.match_date).toISOString().slice(0, 16) : ''} onChange={(e) => setForm({ ...form, match_date: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Status</Label>
                <select value={form.status || 'scheduled'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="scheduled">Scheduled</option><option value="finished">Finished</option><option value="live">Live</option>
                </select>
              </div>
              <div><Label>DVSC Score</Label><Input type="number" value={form.dvsc_score ?? ''} onChange={(e) => setForm({ ...form, dvsc_score: parseInt(e.target.value) || null })} /></div>
              <div><Label>Opp Score</Label><Input type="number" value={form.opponent_score ?? ''} onChange={(e) => setForm({ ...form, opponent_score: parseInt(e.target.value) || null })} /></div>
            </div>
            <Button onClick={handleSave}><Check className="mr-2 h-4 w-4" /> Save</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold">Match Management</h1><p className="text-sm text-muted-foreground">Manage fixtures and results</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from TheSportsDB'}
          </Button>
          <Button onClick={() => { setCreating(true); setForm({ home_away: 'home', status: 'scheduled' }); }}><Plus className="mr-2 h-4 w-4" /> New Fixture</Button>
        </div>
      </div>
      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="space-y-3">
          {fixtures.map((f) => (
            <Card key={f.id} className="flex items-center justify-between p-4 border-border/40">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={f.status === 'finished' ? 'default' : f.status === 'live' ? 'destructive' : 'outline'}>{f.status}</Badge>
                  <Badge variant="outline">{f.competition}</Badge>
                  <Badge variant="secondary">{f.home_away}</Badge>
                  {f.api_event_id && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">API</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {f.opponent_badge_url && (
                    <img src={f.opponent_badge_url} alt={f.opponent} className="h-5 w-5 object-contain" />
                  )}
                  <p className="font-medium">DVSC vs {f.opponent}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(f.match_date).toLocaleString('en-GB')} - {f.venue}</p>
                {f.status === 'finished' && <p className="text-sm font-bold mt-1">{f.dvsc_score} - {f.opponent_score}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setForm(f); }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
