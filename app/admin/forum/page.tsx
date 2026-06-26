'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import { Pin, Lock, Eye, EyeOff, Trash2, Flag } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  category: string;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  created_at: string;
  profiles?: { display_name: string } | null;
}

interface Report {
  id: string;
  comment_id: string;
  reason: string;
  status: string;
  created_at: string;
  comments?: { content: string; user_id: string } | null;
}

export default function AdminForumPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'topics' | 'reports'>('topics');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [topicsRes, reportsRes] = await Promise.all([
      supabase.from('forum_topics').select('id, title, category, views, is_pinned, is_locked, is_hidden, created_at, profiles(display_name)').order('created_at', { ascending: false }),
      supabase.from('comment_reports').select('id, comment_id, reason, status, created_at, comments(content, user_id)').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);
    setTopics((topicsRes.data as unknown as Topic[]) ?? []);
    setReports((reportsRes.data as unknown as Report[]) ?? []);
    setLoading(false);
  };

  const togglePin = async (topic: Topic) => {
    await supabase.from('forum_topics').update({ is_pinned: !topic.is_pinned }).eq('id', topic.id);
    toast.success(topic.is_pinned ? 'Unpinned.' : 'Pinned.');
    logAdminAction('toggle_pin_topic', 'forum_topics', topic.id, { pinned: !topic.is_pinned });
    loadData();
  };

  const toggleLock = async (topic: Topic) => {
    await supabase.from('forum_topics').update({ is_locked: !topic.is_locked }).eq('id', topic.id);
    toast.success(topic.is_locked ? 'Unlocked.' : 'Locked.');
    logAdminAction('toggle_lock_topic', 'forum_topics', topic.id, { locked: !topic.is_locked });
    loadData();
  };

  const toggleHide = async (topic: Topic) => {
    await supabase.from('forum_topics').update({ is_hidden: !topic.is_hidden }).eq('id', topic.id);
    toast.success(topic.is_hidden ? 'Unhidden.' : 'Hidden.');
    logAdminAction('toggle_hide_topic', 'forum_topics', topic.id, { hidden: !topic.is_hidden });
    loadData();
  };

  const resolveReport = async (reportId: string, action: 'resolved' | 'hidden') => {
    await supabase.from('comment_reports').update({ status: action === 'hidden' ? 'actioned' : 'resolved' }).eq('id', reportId);
    if (action === 'hidden' && reports.find((r) => r.id === reportId)?.comment_id) {
      const report = reports.find((r) => r.id === reportId);
      if (report?.comment_id) {
        await supabase.from('comments').update({ is_hidden: true }).eq('id', report.comment_id);
      }
    }
    toast.success(action === 'hidden' ? 'Comment hidden.' : 'Report resolved.');
    logAdminAction('resolve_report', 'comment_reports', reportId, { action });
    loadData();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Forum Moderation</h1>
        <p className="text-sm text-muted-foreground">Manage topics and reported comments</p>
      </div>

      <div className="mb-4 flex gap-2">
        <Button variant={tab === 'topics' ? 'default' : 'outline'} size="sm" onClick={() => setTab('topics')}>
          Topics ({topics.length})
        </Button>
        <Button variant={tab === 'reports' ? 'default' : 'outline'} size="sm" onClick={() => setTab('reports')}>
          <Flag className="mr-1 h-4 w-4" /> Reports ({reports.length})
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tab === 'topics' ? (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Card key={topic.id} className="flex items-center justify-between p-4 border-border/40">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {topic.is_pinned && <Badge variant="default"><Pin className="h-3 w-3" /></Badge>}
                  {topic.is_locked && <Badge variant="secondary"><Lock className="h-3 w-3" /></Badge>}
                  {topic.is_hidden && <Badge variant="destructive">Hidden</Badge>}
                  <Badge variant="outline">{topic.category}</Badge>
                </div>
                <h3 className={`font-medium truncate ${topic.is_hidden ? 'line-through text-muted-foreground' : ''}`}>
                  {topic.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  by {topic.profiles?.display_name ?? 'Unknown'} - {topic.views} views
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => togglePin(topic)} title="Pin/Unpin">
                  <Pin className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleLock(topic)} title="Lock/Unlock">
                  <Lock className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleHide(topic)} title="Hide/Show">
                  {topic.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <Card className="p-8 border-border/40 text-center">
              <Flag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No pending reports.</p>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="p-4 border-border/40">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="destructive" className="mb-2">Reported</Badge>
                    <p className="text-sm font-medium">Reason: {report.reason}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Comment: "{report.comments?.content ?? 'N/A'}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(report.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => resolveReport(report.id, 'resolved')}>
                      Dismiss
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => resolveReport(report.id, 'hidden')}>
                      Hide Comment
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
