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
import { Bot, Check, X, Edit, FileText, Sparkles, ArrowLeft } from 'lucide-react';

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
  rejection_reason: string;
  created_at: string;
}

export default function AdminAIApprovalsPage() {
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AIDraft | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AIDraft>>({});
  const [generating, setGenerating] = useState(false);
  const [genType, setGenType] = useState('article');
  const [genPrompt, setGenPrompt] = useState('');

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_drafts')
      .select('*')
      .order('created_at', { ascending: false });
    setDrafts((data as AIDraft[]) ?? []);
    setLoading(false);
  };

  const handleApprove = async (draft: AIDraft) => {
    const slug = (draft.suggested_headline || 'ai-article').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { error } = await supabase.from('news_articles').insert({
      title: draft.suggested_headline,
      slug,
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
      toast.error('Failed to publish article.');
      return;
    }
    await supabase.from('ai_drafts').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', draft.id);
    toast.success('Article approved and published!');
    logAdminAction('approve_ai_draft', 'ai_drafts', draft.id, { headline: draft.suggested_headline });
    setSelected(null);
    loadDrafts();
  };

  const handleEditAndPublish = async () => {
    if (!selected) return;
    const slug = (editForm.suggested_headline || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { error } = await supabase.from('news_articles').insert({
      title: editForm.suggested_headline,
      slug,
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
      toast.error('Failed to publish.');
      return;
    }
    await supabase.from('ai_drafts').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', selected.id);
    toast.success('Edited article published!');
    logAdminAction('edit_and_publish_ai_draft', 'ai_drafts', selected.id, { headline: editForm.suggested_headline });
    setEditing(false);
    setSelected(null);
    loadDrafts();
  };

  const handleReject = async (draft: AIDraft) => {
    const reason = prompt('Reason for rejection (optional):') || '';
    await supabase.from('ai_drafts').update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    }).eq('id', draft.id);
    toast.success('Draft rejected.');
    logAdminAction('reject_ai_draft', 'ai_drafts', draft.id, { reason });
    setSelected(null);
    loadDrafts();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: genType, prompt: genPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');
      toast.success('AI draft generated!');
      setGenPrompt('');
      loadDrafts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate.');
    }
    setGenerating(false);
  };

  if (selected) {
    const draft = editing ? editForm : selected;
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => { setSelected(null); setEditing(false); }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Drafts
        </Button>

        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">AI Draft Review</h1>
          <Badge variant="secondary">{selected.draft_type}</Badge>
        </div>

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
                <Textarea value={draft.generated_content || ''} onChange={(e) => setEditForm({ ...editForm, generated_content: e.target.value })} rows={10} />
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
            {/* Source Info */}
            {selected.source_info && (
              <Card className="p-4 border-border/40">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Source Information
                </h3>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(selected.source_info, null, 2)}
                </pre>
              </Card>
            )}

            {/* AI Generated Content */}
            <Card className="p-6 border-border/40">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Suggested Headline</p>
                  <h2 className="font-display text-xl font-bold">{selected.suggested_headline}</h2>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">SEO Title</p>
                  <p className="text-sm">{selected.seo_title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Meta Description</p>
                  <p className="text-sm text-muted-foreground">{selected.meta_description}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm">{selected.ai_summary}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Featured Image Suggestion</p>
                  <p className="text-sm text-muted-foreground">{selected.image_suggestion || 'No suggestion provided'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Full Article</p>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-line max-h-96 overflow-y-auto">
                    {selected.generated_content}
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleApprove(selected)} size="lg">
                <Check className="mr-2 h-5 w-5" /> Approve & Publish
              </Button>
              <Button variant="outline" onClick={() => { setEditing(true); setEditForm(selected); }} size="lg">
                <Edit className="mr-2 h-5 w-5" /> Edit Before Publishing
              </Button>
              <Button variant="destructive" onClick={() => handleReject(selected)} size="lg">
                <X className="mr-2 h-5 w-5" /> Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> AI Content Approvals
        </h1>
        <p className="text-sm text-muted-foreground">Review and approve AI-generated content</p>
      </div>

      {/* AI Generation */}
      <Card className="mb-6 p-6 border-border/40">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Generate New Content
        </h2>
        <div className="space-y-3">
          <div>
            <Label>Content Type</Label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="article">News Article</option>
              <option value="preview">Match Preview</option>
              <option value="report">Match Report</option>
              <option value="transfer">Transfer Rumor</option>
              <option value="social">Social Media Caption</option>
              <option value="seo">SEO Metadata</option>
              <option value="summary">Article Summary</option>
            </select>
          </div>
          <div>
            <Label>Prompt / Topic</Label>
            <Input
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              placeholder="e.g. DVSC sign new midfielder from Brazil"
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !genPrompt}>
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>
      </Card>

      {/* Drafts List */}
      <h2 className="font-display text-lg font-bold mb-4">Pending Drafts</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : drafts.length === 0 ? (
        <Card className="p-8 border-border/40 text-center">
          <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No AI drafts yet. Generate one above!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Card
              key={draft.id}
              className="flex items-center justify-between p-4 border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelected(draft)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={draft.status === 'pending' ? 'secondary' : draft.status === 'approved' ? 'default' : 'destructive'}>
                    {draft.status}
                  </Badge>
                  <Badge variant="outline">{draft.draft_type}</Badge>
                </div>
                <h3 className="font-medium truncate">{draft.suggested_headline || 'Untitled'}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(draft.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <Button size="sm" variant="ghost">
                <FileText className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
