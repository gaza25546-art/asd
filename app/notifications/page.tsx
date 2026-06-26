'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bell, BellRing, Check, Trash2, BellOff } from 'lucide-react';

interface NotifPref {
  breaking_news: boolean;
  match_start: boolean;
  goal_alerts: boolean;
  final_score: boolean;
  transfer_news: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [prefs, setPrefs] = useState<NotifPref | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
    if (user) {
      loadPrefs();
      loadNotifications();
    }
  }, [user, loading]);

  const loadPrefs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('breaking_news, match_start, goal_alerts, final_score, transfer_news')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setPrefs(data);
    } else {
      // Create default prefs
      const defaults = {
        breaking_news: true, match_start: true, goal_alerts: true,
        final_score: true, transfer_news: true,
      };
      await supabase.from('notification_preferences').insert({ user_id: user.id, ...defaults });
      setPrefs(defaults);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) ?? []);
    setLoadingData(false);
  };

  const togglePref = async (key: keyof NotifPref, value: boolean) => {
    if (!user || !prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    const { error } = await supabase
      .from('notification_preferences')
      .update({ ...updated, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) toast.error('Failed to update preference.');
    else toast.success('Preference updated.');
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    loadNotifications();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    toast.success('All notifications marked as read.');
    loadNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    loadNotifications();
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const prefLabels = [
    { key: 'breaking_news' as const, label: 'Breaking News', desc: 'Major club announcements', icon: BellRing },
    { key: 'match_start' as const, label: 'Match Start', desc: 'Notifications when matches kick off', icon: Bell },
    { key: 'goal_alerts' as const, label: 'Goal Alerts', desc: 'Real-time goal notifications', icon: BellRing },
    { key: 'final_score' as const, label: 'Final Score', desc: 'Full-time results', icon: Bell },
    { key: 'transfer_news' as const, label: 'Transfer News', desc: 'Player transfers and rumors', icon: Bell },
  ];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-display text-3xl font-bold mb-8">Notifications</h1>

      {/* Preferences */}
      <Card className="p-6 mb-8 border-border/40">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Notification Preferences
        </h2>
        <div className="space-y-4">
          {prefLabels.map((pref) => (
            <div key={pref.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <pref.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">{pref.label}</Label>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
              </div>
              <Switch
                checked={prefs?.[pref.key] ?? true}
                onCheckedChange={(v) => togglePref(pref.key, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Notification Center */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold">
          Notification Center
          {unreadCount > 0 && <Badge className="ml-2">{unreadCount} new</Badge>}
        </h2>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <Check className="mr-1 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {loadingData ? (
        <p className="text-muted-foreground text-sm">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <Card className="p-8 border-border/40 text-center">
          <BellOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`flex items-start justify-between p-4 border-border/40 transition-colors ${
                !notif.is_read ? 'bg-primary/5 border-primary/20' : ''
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                  notif.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
                }`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{notif.title}</p>
                    {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!notif.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => markAsRead(notif.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteNotification(notif.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
