'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { FileText, RefreshCw, Webhook, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { logAdminAction } from '@/components/admin/admin-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminAutomationPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ name: '', action_type: 'publish_news', webhook_url: '', secret: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [logsRes, webhooksRes] = await Promise.all([
      supabase.from('automation_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('automation_webhooks').select('*').order('created_at', { ascending: false }),
    ]);
    setLogs(logsRes.data ?? []);
    setWebhooks(webhooksRes.data ?? []);
    setLoading(false);
  };

  const handleAddWebhook = async () => {
    if (!webhookForm.name || !webhookForm.action_type) { toast.error('Fill required fields.'); return; }
    const { error } = await supabase.from('automation_webhooks').insert({ ...webhookForm, is_active: true });
    if (error) toast.error('Failed to add webhook.');
    else { toast.success('Webhook added!'); logAdminAction('add_webhook', 'automation_webhooks'); setShowAddWebhook(false); setWebhookForm({ name: '', action_type: 'publish_news', webhook_url: '', secret: '' }); loadData(); }
  };

  const handleDeleteWebhook = async (id: string) => {
    await supabase.from('automation_webhooks').delete().eq('id', id);
    toast.success('Webhook removed.'); logAdminAction('delete_webhook', 'automation_webhooks', id); loadData();
  };

  const actionTypes = ['publish_news', 'update_fixtures', 'update_standings', 'transfer_news', 'push_notification', 'send_newsletter', 'moderate_content'];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold">Automation Logs</h1><p className="text-sm text-muted-foreground">Make.com integration and webhook management</p></div>
        <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      {/* Webhooks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2"><Webhook className="h-5 w-5 text-primary" /> Registered Webhooks</h2>
          <Button size="sm" onClick={() => setShowAddWebhook(!showAddWebhook)}><Plus className="mr-1 h-4 w-4" /> Add</Button>
        </div>

        {showAddWebhook && (
          <Card className="mb-4 p-4 border-border/40">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={webhookForm.name} onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })} /></div>
              <div><Label>Action Type</Label>
                <select value={webhookForm.action_type} onChange={(e) => setWebhookForm({ ...webhookForm, action_type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div><Label>Webhook URL</Label><Input value={webhookForm.webhook_url} onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })} placeholder="https://hook.make.com/..." /></div>
              <div><Label>Secret</Label><Input value={webhookForm.secret} onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })} placeholder="Optional secret" /></div>
            </div>
            <Button className="mt-3" size="sm" onClick={handleAddWebhook}>Add Webhook</Button>
          </Card>
        )}

        <div className="space-y-2">
          {webhooks.map((wh) => (
            <Card key={wh.id} className="flex items-center justify-between p-3 border-border/40">
              <div className="flex items-center gap-3">
                <Webhook className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{wh.name}</p>
                  <p className="text-xs text-muted-foreground">{wh.action_type} - {wh.webhook_url || 'No URL'}</p>
                </div>
                <Badge variant={wh.is_active ? 'default' : 'secondary'}>{wh.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteWebhook(wh.id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
          {webhooks.length === 0 && <p className="text-sm text-muted-foreground">No webhooks registered yet.</p>}
        </div>
      </div>

      {/* Logs */}
      <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Recent Automation Actions</h2>
      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <Card className="border-border/40">
          {logs.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No automation actions logged yet.</p> : (
            <div className="divide-y divide-border/20">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge>
                    <div>
                      <p className="text-sm font-medium">{log.action_type}</p>
                      <p className="text-xs text-muted-foreground">Source: {log.source}{log.message ? ` - ${log.message}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('en-GB')}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
