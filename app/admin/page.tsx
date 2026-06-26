'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Newspaper, Users, MessageSquare, Calendar, Vote, Bot, FileText, TrendingUp, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    articles: 0,
    pendingArticles: 0,
    users: 0,
    forumTopics: 0,
    fixtures: 0,
    polls: 0,
    aiDrafts: 0,
    automationLogs: 0,
    comments: 0,
    predictions: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const [
      articles, pendingArticles, users, forumTopics, fixtures,
      polls, aiDrafts, automationLogs, comments, predictions
    ] = await Promise.all([
      supabase.from('news_articles').select('id', { count: 'exact' }),
      supabase.from('news_articles').select('id', { count: 'exact' }).eq('status', 'pending_approval'),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('forum_topics').select('id', { count: 'exact' }),
      supabase.from('fixtures').select('id', { count: 'exact' }),
      supabase.from('polls').select('id', { count: 'exact' }),
      supabase.from('ai_drafts').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('automation_logs').select('id', { count: 'exact' }),
      supabase.from('comments').select('id', { count: 'exact' }),
      supabase.from('match_predictions').select('id', { count: 'exact' }),
    ]);

    setStats({
      articles: articles.count ?? 0,
      pendingArticles: pendingArticles.count ?? 0,
      users: users.count ?? 0,
      forumTopics: forumTopics.count ?? 0,
      fixtures: fixtures.count ?? 0,
      polls: polls.count ?? 0,
      aiDrafts: aiDrafts.count ?? 0,
      automationLogs: automationLogs.count ?? 0,
      comments: comments.count ?? 0,
      predictions: predictions.count ?? 0,
    });

    const { data: logs } = await supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentLogs(logs ?? []);

    setLoading(false);
  };

  const statCards = [
    { label: 'Total Articles', value: stats.articles, icon: Newspaper, href: '/admin/news', color: 'text-blue-500' },
    { label: 'Pending Approval', value: stats.pendingArticles, icon: Bot, href: '/admin/ai-approvals', color: 'text-orange-500' },
    { label: 'Registered Users', value: stats.users, icon: Users, href: '/admin/users', color: 'text-green-500' },
    { label: 'Forum Topics', value: stats.forumTopics, icon: MessageSquare, href: '/admin/forum', color: 'text-purple-500' },
    { label: 'Fixtures', value: stats.fixtures, icon: Calendar, href: '/admin/matches', color: 'text-cyan-500' },
    { label: 'Polls', value: stats.polls, icon: Vote, href: '/admin/polls', color: 'text-pink-500' },
    { label: 'AI Drafts', value: stats.aiDrafts, icon: Bot, href: '/admin/ai-approvals', color: 'text-yellow-500' },
    { label: 'Comments', value: stats.comments, icon: MessageSquare, href: '/admin/forum', color: 'text-indigo-500' },
    { label: 'Predictions', value: stats.predictions, icon: TrendingUp, href: '/admin/analytics', color: 'text-teal-500' },
    { label: 'Automation Logs', value: stats.automationLogs, icon: FileText, href: '/admin/automation', color: 'text-red-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of DVSC fan portal activity</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading stats...</p>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {statCards.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="p-4 border-border/40 hover:border-primary/40 transition-colors">
                  <stat.icon className={`mb-2 h-6 w-6 ${stat.color}`} />
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/ai-approvals">
              <Card className="group flex items-center gap-3 p-4 border-border/40 hover:border-primary/40 transition-colors">
                <Bot className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Review AI Drafts</p>
                  <p className="text-xs text-muted-foreground">{stats.aiDrafts} pending</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>
            <Link href="/admin/news">
              <Card className="group flex items-center gap-3 p-4 border-border/40 hover:border-primary/40 transition-colors">
                <Newspaper className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Manage News</p>
                  <p className="text-xs text-muted-foreground">{stats.articles} articles</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>
            <Link href="/admin/matches">
              <Card className="group flex items-center gap-3 p-4 border-border/40 hover:border-primary/40 transition-colors">
                <Calendar className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Update Matches</p>
                  <p className="text-xs text-muted-foreground">{stats.fixtures} fixtures</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>
            <Link href="/admin/automation">
              <Card className="group flex items-center gap-3 p-4 border-border/40 hover:border-primary/40 transition-colors">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Automation Logs</p>
                  <p className="text-xs text-muted-foreground">{stats.automationLogs} actions</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>
          </div>

          {/* Recent Automation Activity */}
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold mb-4">Recent Automation Activity</h2>
            <Card className="border-border/40">
              {recentLogs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No automation activity yet.</p>
              ) : (
                <div className="divide-y divide-border/20">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{log.action_type}</p>
                          <p className="text-xs text-muted-foreground">Source: {log.source}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('en-GB')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
