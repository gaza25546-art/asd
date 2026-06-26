'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import { Bell, Send, Users } from 'lucide-react';

export default function AdminNotificationsPage() {
  const [userCount, setUserCount] = useState(0);
  const [form, setForm] = useState({ type: 'breaking_news', title: '', message: '', link: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact' }).then(({ count }) => setUserCount(count ?? 0));
  }, []);

  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error('Fill required fields.'); return; }
    setSending(true);
    // Get all users with this notification preference enabled
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq(form.type, true);

    const userIds = (prefs ?? []).map((p) => p.user_id);
    if (userIds.length === 0) {
      toast.info('No users with this notification preference enabled.');
      setSending(false);
      return;
    }

    // Insert notifications for each user
    const notifications = userIds.map((uid) => ({
      user_id: uid,
      type: form.type,
      title: form.title,
      message: form.message,
      link: form.link || null,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) {
      toast.error('Failed to send notifications.');
    } else {
      toast.success(`Notification sent to ${userIds.length} users!`);
      logAdminAction('send_notification', 'notifications', undefined, { type: form.type, count: userIds.length });
      setForm({ type: 'breaking_news', title: '', message: '', link: '' });
    }
    setSending(false);
  };

  const types = [
    { value: 'breaking_news', label: 'Breaking News' },
    { value: 'match_start', label: 'Match Start' },
    { value: 'goal_alerts', label: 'Goal Alerts' },
    { value: 'final_score', label: 'Final Score' },
    { value: 'transfer_news', label: 'Transfer News' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Push Notification Management</h1>
        <p className="text-sm text-muted-foreground">Send notifications to DVSC supporters</p>
      </div>

      <Card className="mb-6 flex items-center gap-4 p-4 border-border/40">
        <Users className="h-8 w-8 text-primary" />
        <div><p className="font-display text-2xl font-bold">{userCount}</p><p className="text-xs text-muted-foreground">Registered Users</p></div>
      </Card>

      <Card className="p-6 border-border/40">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Send Notification
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Notification Type</Label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. GOAL! DVSC 1-0" /></div>
          <div><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Notification message..." /></div>
          <div><Label>Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/news/..." /></div>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Send Notification'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
