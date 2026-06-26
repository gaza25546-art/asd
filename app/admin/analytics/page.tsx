'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Newspaper, Users, MessageSquare, TrendingUp, Vote, Mail, Eye, Target } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalArticles: 0,
    totalComments: 0,
    totalForumTopics: 0,
    totalForumReplies: 0,
    totalPredictions: 0,
    totalPolls: 0,
    totalNewsletterSubs: 0,
    pendingReports: 0,
  });
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [
      users, newUsers, articles, comments, topics, replies,
      predictions, polls, newsletter, reports
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', oneMonthAgo.toISOString()),
      supabase.from('news_articles').select('id', { count: 'exact' }),
      supabase.from('comments').select('id', { count: 'exact' }),
      supabase.from('forum_topics').select('id', { count: 'exact' }),
      supabase.from('forum_replies').select('id', { count: 'exact' }),
      supabase.from('match_predictions').select('id', { count: 'exact' }),
      supabase.from('polls').select('id', { count: 'exact' }),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact' }),
      supabase.from('comment_reports').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);

    setStats({
      totalUsers: users.count ?? 0,
      newUsersThisMonth: newUsers.count ?? 0,
      totalArticles: articles.count ?? 0,
      totalComments: comments.count ?? 0,
      totalForumTopics: topics.count ?? 0,
      totalForumReplies: replies.count ?? 0,
      totalPredictions: predictions.count ?? 0,
      totalPolls: polls.count ?? 0,
      totalNewsletterSubs: newsletter.count ?? 0,
      pendingReports: reports.count ?? 0,
    });

    const { data: articlesData } = await supabase
      .from('news_articles')
      .select('title, published_at, category')
      .order('published_at', { ascending: false })
      .limit(5);
    setTopArticles(articlesData ?? []);

    setLoading(false);
  };

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `+${stats.newUsersThisMonth} this month`, icon: Users, color: 'text-blue-500' },
    { label: 'Articles', value: stats.totalArticles, sub: 'Published', icon: Newspaper, color: 'text-green-500' },
    { label: 'Comments', value: stats.totalComments, sub: 'Total', icon: MessageSquare, color: 'text-purple-500' },
    { label: 'Forum Topics', value: stats.totalForumTopics, sub: `${stats.totalForumReplies} replies`, icon: MessageSquare, color: 'text-indigo-500' },
    { label: 'Predictions', value: stats.totalPredictions, sub: 'Total made', icon: Target, color: 'text-teal-500' },
    { label: 'Polls', value: stats.totalPolls, sub: 'Active', icon: Vote, color: 'text-pink-500' },
    { label: 'Newsletter', value: stats.totalNewsletterSubs, sub: 'Subscribers', icon: Mail, color: 'text-orange-500' },
    { label: 'Pending Reports', value: stats.pendingReports, sub: 'Needs attention', icon: Eye, color: 'text-red-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Track engagement and platform activity</p>
      </div>

      {loading ? <p className="text-muted-foreground">Loading analytics...</p> : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label} className="p-4 border-border/40">
                <card.icon className={`mb-2 h-6 w-6 ${card.color}`} />
                <p className="font-display text-3xl font-bold">{card.value}</p>
                <p className="text-sm font-medium mt-1">{card.label}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-bold mb-4">Recent Articles</h2>
            <Card className="border-border/40">
              <div className="divide-y divide-border/20">
                {topArticles.map((article, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-muted-foreground">{article.category}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(article.published_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
