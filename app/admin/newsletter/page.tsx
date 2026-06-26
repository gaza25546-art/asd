'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import { Mail, Send, Plus, Users } from 'lucide-react';

export default function AdminNewsletterPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [campRes, subRes] = await Promise.all([
      supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact' }),
    ]);
    setCampaigns(campRes.data ?? []);
    setSubscribers(subRes.count ?? 0);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.subject || !form.body) { toast.error('Fill all fields.'); return; }
    const { error } = await supabase.from('newsletter_campaigns').insert({ ...form, status: 'draft' });
    if (error) toast.error('Failed to create campaign.');
    else { toast.success('Campaign created!'); logAdminAction('create_campaign', 'newsletter_campaigns'); setCreating(false); setForm({ subject: '', body: '' }); loadData(); }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this campaign to all subscribers?')) return;
    await supabase.from('newsletter_campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: subscribers }).eq('id', id);
    toast.success(`Campaign sent to ${subscribers} subscribers!`);
    logAdminAction('send_campaign', 'newsletter_campaigns', id, { sent_count: subscribers });
    loadData();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold">Newsletter Management</h1><p className="text-sm text-muted-foreground">Create and send email campaigns</p></div>
        <Button onClick={() => setCreating(!creating)}><Plus className="mr-2 h-4 w-4" /> New Campaign</Button>
      </div>

      <Card className="mb-6 flex items-center gap-4 p-4 border-border/40">
        <Users className="h-8 w-8 text-primary" />
        <div><p className="font-display text-2xl font-bold">{subscribers}</p><p className="text-xs text-muted-foreground">Total Subscribers</p></div>
      </Card>

      {creating && (
        <Card className="mb-6 p-6 border-border/40">
          <div className="space-y-4">
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} /></div>
            <Button onClick={handleCreate}>Save as Draft</Button>
          </div>
        </Card>
      )}

      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="space-y-3">
          {campaigns.map((camp) => (
            <Card key={camp.id} className="p-4 border-border/40">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-primary" />
                    <Badge variant={camp.status === 'sent' ? 'default' : 'secondary'}>{camp.status}</Badge>
                  </div>
                  <p className="font-medium">{camp.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{camp.body}</p>
                  {camp.status === 'sent' && <p className="text-xs text-green-500 mt-1">Sent to {camp.sent_count} subscribers</p>}
                </div>
                {camp.status === 'draft' && (
                  <Button size="sm" onClick={() => handleSend(camp.id)}><Send className="mr-1 h-4 w-4" /> Send</Button>
                )}
              </div>
            </Card>
          ))}
          {campaigns.length === 0 && <p className="text-muted-foreground text-sm">No campaigns yet.</p>}
        </div>
      )}
    </div>
  );
}
