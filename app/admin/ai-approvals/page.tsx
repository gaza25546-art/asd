'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import { Bot, Check, X, CreditCard as Edit, FileText, Sparkles, ArrowLeft, Globe, Clock, ExternalLink, RefreshCw, CircleAlert as AlertCircle, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';

interface ScrapedArticle {
  id: string;
  original_url: string;
  original_title: string;
  original_content: string;
  original_excerpt: string;
  scraped_at: string;
  status: string;
  ai_draft_id: string | null;
  source_id: string;
  news_sources?: { name: string };
  is_duplicate?: boolean;
}

interface AIDraft {
  id: string;
  draft_type: string;
  source_info: any;
  generated_content: string;
  suggested_headline: string;
  seo_title: string;
  meta_description: string;
  image_suggestion: string;
  ai_summary: string;
  status: string;
  review_status: string;
  rejection_reason: string;
  created_at: string;
  scraped_article_id: string;
  related_sources: { source: string; url: string; title: string }[];
  dedup_group_id: string | null;
}

export default function AdminAIApprovalsPage() {
  const [scraped, setScraped] = useState<ScrapedArticle[]>([]);
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<AIDraft | null>(null);
  const [selectedScraped, setSelectedScraped] = useState<ScrapedArticle | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AIDraft>>({});
  const [activeTab, setActiveTab] = useState('pending');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);

    // Load scraped articles with source info
    const { data: scrapedData } = await supabase
      .from('scraped_articles')
      .select('*, news_sources(name)')
      .order('scraped_at', { ascending: false })
      .limit(50);
    setScraped((scrapedData as any[]) ?? []);

    // Load AI drafts
    const { data: draftsData } = await supabase
      .from('ai_drafts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setDrafts((draftsData as AIDraft[]) ?? []);

    setLoading(false);
  };

  const pendingDrafts = drafts.filter(d => d.review_status === 'pending');
  const approvedDrafts = drafts.filter(d => d.review_status === 'approved');
  const rejectedDrafts = drafts.filter(d => d.review_status === 'rejected');

  const handleApprove = async (draft: AIDraft) => {
    const slug = (draft.suggested_headline || 'ai-article').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { error } = await supabase.from('news_articles').insert({
      title: draft.suggested_headline,
      slug: slug + '-' + Date.now().toString(36),
      excerpt: draft.ai_summary || draft.generated_content.slice(0, 150),
      content: draft.generated_content,
      image_url: draft.image_suggestion || 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg',
      category: 'AI Generated',
      author: 'AI Editorial',
      status: 'published',
      ai_generated: true,
      ai_summary: draft.ai_summary,
      seo_title: draft.seo_title,
      meta_description: draft.meta_description,
      source_info: draft.source_info,
    });

    if (error) {
      toast.error('Failed to publish article: ' + error.message);
      return;
    }

    await supabase.from('ai_drafts').update({
      status: 'approved',
      review_status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', draft.id);

    // Update scraped article status too
    if (draft.scraped_article_id) {
      await supabase.from('scraped_articles').update({ status: 'approved' }).eq('id', draft.scraped_article_id);
    }

    toast.success('Article approved and published!');
    logAdminAction('approve_ai_draft', 'ai_drafts', draft.id, { headline: draft.suggested_headline });
    setSelectedDraft(null);
    setSelectedScraped(null);
    loadData();
  };

  const handleEditAndPublish = async () => {
    if (!selectedDraft) return;
    const slug = (editForm.suggested_headline || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { error } = await supabase.from('news_articles').insert({
      title: editForm.suggested_headline,
      slug: slug + '-' + Date.now().toString(36),
      excerpt: editForm.ai_summary || (editForm.generated_content || '').slice(0, 150),
      content: editForm.generated_content,
      image_url: editForm.image_suggestion || 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg',
      category: 'AI Generated',
      author: 'AI Editorial',
      status: 'published',
      ai_generated: true,
      ai_summary: editForm.ai_summary,
      seo_title: editForm.seo_title,
      meta_description: editForm.meta_description,
    });

    if (error) {
      toast.error('Failed to publish: ' + error.message);
      return;
    }

    await supabase.from('ai_drafts').update({
      status: 'approved',
      review_status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', selectedDraft.id);

    if (selectedDraft.scraped_article_id) {
      await supabase.from('scraped_articles').update({ status: 'approved' }).eq('id', selectedDraft.scraped_article_id);
    }

    toast.success('Edited article published!');
    logAdminAction('edit_and_publish_ai_draft', 'ai_drafts', selectedDraft.id, { headline: editForm.suggested_headline });
    setEditing(false);
    setSelectedDraft(null);
    loadData();
  };

  const handleReject = async (draft: AIDraft) => {
    const reason = prompt('Reason for rejection (optional):') || '';
    await supabase.from('ai_drafts').update({
      status: 'rejected',
      review_status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    }).eq('id', draft.id);

    if (draft.scraped_article_id) {
      await supabase.from('scraped_articles').update({ status: 'rejected' }).eq('id', draft.scraped_article_id);
    }

    toast.success('Draft rejected.');
    logAdminAction('reject_ai_draft', 'ai_drafts', draft.id, { reason });
    setSelectedDraft(null);
    loadData();
  };

  const handleProcessAI = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Processing failed');
      toast.success(`Processed ${data.processed} articles with AI!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process');
    }
    setProcessing(false);
  };

  // Detail view for a draft
  if (selectedDraft) {
    const draft = editing ? editForm : selectedDraft;
    const relatedScraped = scraped.find(s => s.id === selectedDraft.scraped_article_id);

    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => { setSelectedDraft(null); setEditing(false); }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Approvals
        </Button>

        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Review AI Draft</h1>
          <Badge variant={selectedDraft.review_status === 'pending' ? 'secondary' : selectedDraft.review_status === 'approved' ? 'default' : 'destructive'}>
            {selectedDraft.review_status}
          </Badge>
        </div>

        {/* Original Source Info */}
        {relatedScraped && (
          <Card className="p-4 border-border/40 mb-4 bg-amber-50/50 dark:bg-amber-950/20">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-500" /> Original Source
            </h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Source:</span> {relatedScraped.news_sources?.name || 'Unknown'}</p>
              <p><span className="text-muted-foreground">Original Title:</span> {relatedScraped.original_title}</p>
              <p className="flex items-center gap-1">
                <span className="text-muted-foreground">URL:</span>
                <a href={relatedScraped.original_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {relatedScraped.original_url.substring(0, 60)}... <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p><span className="text-muted-foreground">Scraped:</span> {new Date(relatedScraped.scraped_at).toLocaleString('en-GB')}</p>
            </div>
            {relatedScraped.original_excerpt && (
              <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                <strong>Original excerpt:</strong> {relatedScraped.original_excerpt}
              </div>
            )}
          </Card>
        )}

        {editing ? (
          <Card className="p-6 border-border/40">
            <h2 className="font-display text-lg font-bold mb-4">Edit Before Publishing</h2>
            <div className="space-y-4">
              <div>
                <Label>Headline</Label>
                <Input value={draft.suggested_headline || ''} onChange={(e) => setEditForm({ ...editForm, suggested_headline: e.target.value })} />
              </div>
              <div>
                <Label>SEO Title</Label>
                <Input value={draft.seo_title || ''} onChange={(e) => setEditForm({ ...editForm, seo_title: e.target.value })} />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea value={draft.meta_description || ''} onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea value={draft.ai_summary || ''} onChange={(e) => setEditForm({ ...editForm, ai_summary: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={draft.generated_content || ''} onChange={(e) => setEditForm({ ...editForm, generated_content: e.target.value })} rows={12} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={draft.image_suggestion || ''} onChange={(e) => setEditForm({ ...editForm, image_suggestion: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleEditAndPublish}>
                  <Check className="mr-2 h-4 w-4" /> Publish Edited Version
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel Edit</Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="p-6 border-border/40">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Suggested Headline</p>
                  <h2 className="font-display text-xl font-bold">{selectedDraft.suggested_headline}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">SEO Title</p>
                    <p className="text-sm">{selectedDraft.seo_title}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Meta Description</p>
                    <p className="text-sm text-muted-foreground">{selectedDraft.meta_description}</p>
                  </div>
                </div>
                {/* Related Sources from deduplication */}
                {selectedDraft.related_sources && selectedDraft.related_sources.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                      <Globe className="h-3 w-3" /> Related Sources ({selectedDraft.related_sources.length})
                    </p>
                    <div className="space-y-2">
                      {selectedDraft.related_sources.map((src, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded bg-blue-50/50 dark:bg-blue-950/20 text-sm">
                          <Badge variant="outline" className="text-[10px] shrink-0">{src.source}</Badge>
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
                            {src.title || src.url} <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedDraft.ai_summary}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Full Article</p>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-line max-h-[500px] overflow-y-auto">
                    {selectedDraft.generated_content}
                  </div>
                </div>
              </div>
            </Card>

            {selectedDraft.review_status === 'pending' && (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleApprove(selectedDraft)} size="lg" className="bg-green-600 hover:bg-green-700">
                  <ThumbsUp className="mr-2 h-5 w-5" /> Approve & Publish
                </Button>
                <Button variant="outline" onClick={() => { setEditing(true); setEditForm(selectedDraft); }} size="lg">
                  <Edit className="mr-2 h-5 w-5" /> Edit Before Publishing
                </Button>
                <Button variant="destructive" onClick={() => handleReject(selectedDraft)} size="lg">
                  <ThumbsDown className="mr-2 h-5 w-5" /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI News Approvals
          </h1>
          <p className="text-sm text-muted-foreground">Review AI-processed news before publishing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleProcessAI} disabled={processing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
            {processing ? 'Processing...' : 'Process Pending with AI'}
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingDrafts.length}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedDrafts.length}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedDrafts.length}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            <AlertCircle className="mr-1 h-4 w-4" /> Pending ({pendingDrafts.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            <Check className="mr-1 h-4 w-4" /> Approved ({approvedDrafts.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <X className="mr-1 h-4 w-4" /> Rejected ({rejectedDrafts.length})
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Globe className="mr-1 h-4 w-4" /> Sources ({scraped.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <DraftList drafts={pendingDrafts} scraped={scraped} onSelect={setSelectedDraft} loading={loading} emptyMessage="No pending drafts. Scrape some news or trigger AI processing." />
        </TabsContent>

        <TabsContent value="approved">
          <DraftList drafts={approvedDrafts} scraped={scraped} onSelect={setSelectedDraft} loading={loading} emptyMessage="No approved drafts yet." />
        </TabsContent>

        <TabsContent value="rejected">
          <DraftList drafts={rejectedDrafts} scraped={scraped} onSelect={setSelectedDraft} loading={loading} emptyMessage="No rejected drafts." />
        </TabsContent>

        <TabsContent value="sources">
          <ScrapedList scraped={scraped} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DraftList({ drafts, scraped, onSelect, loading, emptyMessage }: {
  drafts: AIDraft[];
  scraped: ScrapedArticle[];
  onSelect: (d: AIDraft) => void;
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (drafts.length === 0) {
    return (
      <Card className="p-8 border-border/40 text-center">
        <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft) => {
        const source = scraped.find(s => s.id === draft.scraped_article_id);
        return (
          <Card
            key={draft.id}
            className="flex items-center justify-between p-4 border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => onSelect(draft)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={draft.review_status === 'pending' ? 'secondary' : draft.review_status === 'approved' ? 'default' : 'destructive'}>
                  {draft.review_status}
                </Badge>
                <Badge variant="outline">{draft.draft_type}</Badge>
                {source && (
                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                    <Globe className="h-2 w-2" /> {source.news_sources?.name || 'Unknown'}
                  </Badge>
                )}
                {draft.related_sources && draft.related_sources.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1">
                    <Globe className="h-2 w-2" /> +{draft.related_sources.length} source{draft.related_sources.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {source?.is_duplicate && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Duplicate</Badge>
                )}
              </div>
              <h3 className="font-medium truncate">{draft.suggested_headline || 'Untitled'}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" /> {new Date(draft.created_at).toLocaleDateString('en-GB')}
                {draft.rejection_reason && <span className="text-red-400 ml-2">Reason: {draft.rejection_reason}</span>}
              </p>
            </div>
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

function ScrapedList({ scraped, loading }: { scraped: ScrapedArticle[]; loading: boolean }) {
  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (scraped.length === 0) {
    return (
      <Card className="p-8 border-border/40 text-center">
        <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">No scraped articles yet. Configure Make.com to send articles to the webhook.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {scraped.map((article) => (
        <Card key={article.id} className="p-4 border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={
                  article.status === 'approved' ? 'default' :
                  article.status === 'rejected' ? 'destructive' :
                  article.status === 'pending_review' ? 'secondary' :
                  'outline'
                }>{article.status}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Globe className="h-2 w-2 mr-1" /> {article.news_sources?.name || 'Unknown'}
                </Badge>
              </div>
              <h3 className="font-medium truncate">{article.original_title}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <a href={article.original_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {article.original_url.substring(0, 50)}... <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(article.scraped_at).toLocaleString('en-GB')}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
