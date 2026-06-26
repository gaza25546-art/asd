'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Trash2, Send, Heart, Flag, Reply, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  is_hidden: boolean;
  parent_id: string | null;
  profiles?: { display_name: string } | null;
  replies?: Comment[];
}

export function CommentSection({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    loadComments();
    if (user) loadLikedComments();
  }, [articleId, user]);

  const loadComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, likes_count, is_hidden, parent_id, profiles(display_name)')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false });
    const allComments = (data as unknown as Comment[]) ?? [];
    // Build nested structure
    const topLevel = allComments.filter((c) => !c.parent_id);
    const nested = topLevel.map((c) => ({
      ...c,
      replies: allComments.filter((r) => r.parent_id === c.id),
    }));
    setComments(nested);
    setLoading(false);
  };

  const loadLikedComments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', user.id);
    setLikedComments(new Set((data ?? []).map((l) => l.comment_id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to comment.'); return; }
    if (!content.trim()) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert({ article_id: articleId, content: content.trim() });
    if (error) toast.error('Failed to post comment.');
    else { setContent(''); toast.success('Comment posted!'); loadComments(); }
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!user) { toast.error('Please sign in to reply.'); return; }
    if (!replyContent.trim()) return;
    const { error } = await supabase
      .from('comments')
      .insert({ article_id: articleId, content: replyContent.trim(), parent_id: parentId });
    if (error) toast.error('Failed to post reply.');
    else { setReplyContent(''); setReplyingTo(null); toast.success('Reply posted!'); loadComments(); }
  };

  const handleLike = async (commentId: string) => {
    if (!user) { toast.error('Please sign in to like.'); return; }
    const isLiked = likedComments.has(commentId);
    if (isLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      await supabase.rpc('decrement_like', { comment_id: commentId });
      setLikedComments((prev) => { const next = new Set(prev); next.delete(commentId); return next; });
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId });
      await supabase.rpc('increment_like', { comment_id: commentId });
      setLikedComments((prev) => new Set(prev).add(commentId));
    }
    loadComments();
  };

  const handleReport = async () => {
    if (!user || !reportTarget || !reportReason.trim()) return;
    const { error } = await supabase
      .from('comment_reports')
      .insert({ comment_id: reportTarget, reason: reportReason.trim() });
    if (error) {
      if (error.code === '23505') toast.info('You have already reported this comment.');
      else toast.error('Failed to report comment.');
    } else {
      toast.success('Comment reported. A moderator will review it.');
    }
    setReportTarget(null);
    setReportReason('');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) toast.error('Failed to delete.');
    else { toast.success('Comment deleted.'); loadComments(); }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const renderComment = (comment: Comment, isReply = false) => {
    if (comment.is_hidden) return null;
    return (
      <div key={comment.id} className={isReply ? 'ml-12' : ''}>
        <div className="flex gap-3 rounded-lg glass p-4">
          <Avatar>
            <AvatarFallback className="bg-primary/20 text-primary">
              {(comment.profiles?.display_name ?? 'F')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{comment.profiles?.display_name ?? 'DVSC Fan'}</p>
              <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-foreground/90">{comment.content}</p>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  likedComments.has(comment.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${likedComments.has(comment.id) ? 'fill-primary' : ''}`} />
                {comment.likes_count > 0 && comment.likes_count}
              </button>
              {user && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" /> Reply
                </button>
              )}
              {user && (
                <button
                  onClick={() => setReportTarget(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </button>
              )}
              {user && comment.user_id === user.id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {replyingTo === comment.id && (
          <div className="ml-12 mt-2 flex gap-2">
            <Input
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
            />
            <Button size="sm" onClick={() => handleReply(comment.id)}><Send className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyContent(''); }}><X className="h-4 w-4" /></Button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12 border-t border-border/40 pt-8">
      <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        Comments ({comments.length})
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            placeholder="Share your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <Button type="submit" disabled={submitting || !content.trim()} size="sm">
            <Send className="mr-2 h-4 w-4" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      ) : (
        <div className="mb-8 rounded-lg glass p-4 text-center text-sm text-muted-foreground">
          Please <a href="/login" className="text-primary font-medium underline">sign in</a> to join the discussion.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Be the first to comment!</p>
      ) : (
        <div className="space-y-4">{comments.map((c) => renderComment(c))}</div>
      )}

      {/* Report Dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(open) => !open && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Reason for reporting..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={!reportReason.trim()}>
              Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
