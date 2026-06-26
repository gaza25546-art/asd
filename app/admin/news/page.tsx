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
import { Plus, Edit, Trash2, X, Check, Eye } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  author: string;
  status: string;
  published_at: string;
}

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Article>>({});

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false });
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.excerpt || !form.content) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (editing) {
      const { error } = await supabase
        .from('news_articles')
        .update({ ...form, slug, status: form.status || 'published' })
        .eq('id', editing.id);
      if (error) toast.error('Failed to update article.');
      else {
        toast.success('Article updated!');
        logAdminAction('update_article', 'news_articles', editing.id, { title: form.title });
        setEditing(null);
        loadArticles();
      }
    } else {
      const { error } = await supabase
        .from('news_articles')
        .insert({ ...form, slug, status: form.status || 'published' });
      if (error) toast.error('Failed to create article.');
      else {
        toast.success('Article created!');
        logAdminAction('create_article', 'news_articles', undefined, { title: form.title });
        setCreating(false);
        loadArticles();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    const { error } = await supabase.from('news_articles').delete().eq('id', id);
    if (error) toast.error('Failed to delete.');
    else {
      toast.success('Article deleted.');
      logAdminAction('delete_article', 'news_articles', id);
      loadArticles();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('news_articles').update({ status }).eq('id', id);
    if (error) toast.error('Failed to update status.');
    else {
      toast.success(`Article ${status}.`);
      logAdminAction('change_article_status', 'news_articles', id, { status });
      loadArticles();
    }
  };

  if (editing || creating) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{editing ? 'Edit Article' : 'New Article'}</h1>
          <Button variant="ghost" onClick={() => { setEditing(null); setCreating(false); }}>
            <X className="mr-1 h-4 w-4" /> Cancel
          </Button>
        </div>
        <Card className="p-6 border-border/40">
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated if empty" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <Label>Author</Label>
                <Input value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={form.status || 'published'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="published">Published</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <Button onClick={handleSave}>
              <Check className="mr-2 h-4 w-4" /> {editing ? 'Update' : 'Create'} Article
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">News Management</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and manage news articles</p>
        </div>
        <Button onClick={() => { setCreating(true); setForm({ category: 'General', author: 'DVSC Media', status: 'published' }); }}>
          <Plus className="mr-2 h-4 w-4" /> New Article
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id} className="flex items-center justify-between p-4 border-border/40">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={article.status === 'published' ? 'default' : article.status === 'pending_approval' ? 'secondary' : 'outline'}>
                    {article.status}
                  </Badge>
                  <Badge variant="outline">{article.category}</Badge>
                </div>
                <h3 className="font-medium truncate">{article.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(article.published_at).toLocaleDateString('en-GB')} - by {article.author}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {article.status !== 'published' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(article.id, 'published')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setEditing(article); setForm(article); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(article.id)}>
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
