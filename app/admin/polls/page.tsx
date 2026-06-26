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
import { Plus, Trash2, Vote } from 'lucide-react';

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ question: '', option_a: '', option_b: '', option_c: '' });

  useEffect(() => { loadPolls(); }, []);

  const loadPolls = async () => {
    setLoading(true);
    const { data } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
    setPolls(data ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.question || !form.option_a || !form.option_b) { toast.error('Fill required fields.'); return; }
    const { error } = await supabase.from('polls').insert({ ...form, option_c: form.option_c || 'N/A' });
    if (error) toast.error('Failed to create poll.');
    else { toast.success('Poll created!'); logAdminAction('create_poll', 'polls'); setCreating(false); setForm({ question: '', option_a: '', option_b: '', option_c: '' }); loadPolls(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this poll?')) return;
    await supabase.from('polls').delete().eq('id', id);
    toast.success('Deleted.'); logAdminAction('delete_poll', 'polls', id); loadPolls();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold">Poll Management</h1><p className="text-sm text-muted-foreground">Create and manage fan polls</p></div>
        <Button onClick={() => setCreating(!creating)}><Plus className="mr-2 h-4 w-4" /> New Poll</Button>
      </div>

      {creating && (
        <Card className="mb-6 p-6 border-border/40">
          <div className="space-y-4">
            <div><Label>Question</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Option A</Label><Input value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} /></div>
              <div><Label>Option B</Label><Input value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} /></div>
              <div><Label>Option C</Label><Input value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} /></div>
            </div>
            <Button onClick={handleCreate}>Create Poll</Button>
          </div>
        </Card>
      )}

      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="space-y-3">
          {polls.map((poll) => {
            const total = (poll.votes_a || 0) + (poll.votes_b || 0) + (poll.votes_c || 0);
            return (
              <Card key={poll.id} className="p-4 border-border/40">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Vote className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium">{poll.question}</p>
                    <p className="text-xs text-muted-foreground">{total} total votes</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(poll.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                  {[
                    { label: poll.option_a, votes: poll.votes_a || 0 },
                    { label: poll.option_b, votes: poll.votes_b || 0 },
                    { label: poll.option_c, votes: poll.votes_c || 0 },
                  ].map((opt, i) => {
                    const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1"><span>{opt.label}</span><span className="text-muted-foreground">{opt.votes} ({pct}%)</span></div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
