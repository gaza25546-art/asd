'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MessageSquare, Eye, Plus, ArrowLeft, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Topic {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  created_at: string;
  user_id: string | null;
  profiles?: { display_name: string } | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  profiles?: { display_name: string } | null;
}

export function ForumClient() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('forum_topics')
      .select('id, title, content, category, views, created_at, user_id, profiles(display_name)')
      .order('created_at', { ascending: false });
    setTopics((data as unknown as Topic[]) ?? []);
    setLoading(false);
  };

  const openTopic = async (topic: Topic) => {
    setSelectedTopic(topic);
    await supabase.from('forum_topics').update({ views: topic.views + 1 }).eq('id', topic.id);
    const { data } = await supabase
      .from('forum_replies')
      .select('id, content, created_at, user_id, profiles(display_name)')
      .eq('topic_id', topic.id)
      .order('created_at', { ascending: true });
    setReplies((data as unknown as Reply[]) ?? []);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to create a topic.');
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('forum_topics').insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });
    if (error) {
      toast.error('Failed to create topic.');
    } else {
      toast.success('Topic created!');
      setNewTitle('');
      setNewContent('');
      setShowNewTopic(false);
      loadTopics();
    }
    setSubmitting(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic) {
      toast.error('Please sign in to reply.');
      return;
    }
    if (!replyContent.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('forum_replies').insert({
      topic_id: selectedTopic.id,
      content: replyContent.trim(),
    });
    if (error) {
      toast.error('Failed to post reply.');
    } else {
      setReplyContent('');
      toast.success('Reply posted!');
      openTopic(selectedTopic);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading forum...</p>;
  }

  // Topic detail view
  if (selectedTopic) {
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-6 group" onClick={() => setSelectedTopic(null)}>
          <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Forum
        </Button>

        <Card className="p-6 mb-6 border-border/40">
          <Badge variant="destructive" className="mb-3">{selectedTopic.category}</Badge>
          <h1 className="font-display text-2xl font-bold mb-3">{selectedTopic.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {(selectedTopic.profiles?.display_name ?? 'D')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{selectedTopic.profiles?.display_name ?? 'DVSC Community'}</span>
            <span>{new Date(selectedTopic.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {selectedTopic.views}</span>
          </div>
          <p className="text-foreground/90 whitespace-pre-line">{selectedTopic.content}</p>
        </Card>

        <h2 className="font-display text-lg font-bold mb-4">Replies ({replies.length})</h2>

        {user ? (
          <form onSubmit={handleReply} className="mb-6">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <Button type="submit" disabled={submitting || !replyContent.trim()} size="sm">
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Posting...' : 'Post Reply'}
            </Button>
          </form>
        ) : (
          <div className="mb-6 rounded-lg glass p-4 text-center text-sm text-muted-foreground">
            Please <a href="/login" className="text-primary font-medium underline">sign in</a> to reply.
          </div>
        )}

        <div className="space-y-4">
          {replies.map((reply) => (
            <Card key={reply.id} className="flex gap-3 p-4 border-border/40">
              <Avatar>
                <AvatarFallback className="bg-primary/20 text-primary">
                  {(reply.profiles?.display_name ?? 'D')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{reply.profiles?.display_name ?? 'DVSC Community'}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90">{reply.content}</p>
              </div>
            </Card>
          ))}
          {replies.length === 0 && (
            <p className="text-sm text-muted-foreground">No replies yet. Be the first!</p>
          )}
        </div>
      </div>
    );
  }

  // New topic form
  if (showNewTopic) {
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-6 group" onClick={() => setShowNewTopic(false)}>
          <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Forum
        </Button>
        <Card className="p-6 border-border/40">
          <h2 className="font-display text-xl font-bold mb-4">Create New Topic</h2>
          <form onSubmit={handleCreateTopic} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="Topic title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option>General</option>
                <option>Match Discussion</option>
                <option>Away Days</option>
                <option>Transfers</option>
                <option>History</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Content</label>
              <Textarea
                placeholder="Write your post..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Topic'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Topic list
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Community Forum</h1>
          <p className="text-sm text-muted-foreground">Discuss all things DVSC with fellow fans</p>
        </div>
        {user ? (
          <Button onClick={() => setShowNewTopic(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Topic
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/login">Sign in to post</Link>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {topics.map((topic) => (
          <Card
            key={topic.id}
            className="flex items-center justify-between p-5 border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => openTopic(topic)}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{topic.category}</Badge>
                </div>
                <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors">
                  {topic.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  by {topic.profiles?.display_name ?? 'DVSC Community'} - {new Date(topic.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" /> {topic.views}
            </div>
          </Card>
        ))}
        {topics.length === 0 && (
          <p className="text-muted-foreground text-sm">No topics yet. Be the first to start a discussion!</p>
        )}
      </div>
    </div>
  );
}
