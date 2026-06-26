'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import { Plus, Trash2, Image as ImageIcon, Bot } from 'lucide-react';

export default function AdminMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', type: 'image', category: 'General' });

  useEffect(() => { loadMedia(); }, []);

  const loadMedia = async () => {
    setLoading(true);
    const { data } = await supabase.from('media_library').select('*').order('created_at', { ascending: false });
    setMedia(data ?? []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.title || !form.url) { toast.error('Fill required fields.'); return; }
    const { error } = await supabase.from('media_library').insert(form);
    if (error) toast.error('Failed to add media.');
    else { toast.success('Media added!'); logAdminAction('add_media', 'media_library'); setCreating(false); setForm({ title: '', url: '', type: 'image', category: 'General' }); loadMedia(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return;
    await supabase.from('media_library').delete().eq('id', id);
    toast.success('Deleted.'); logAdminAction('delete_media', 'media_library', id); loadMedia();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold">Media Library</h1><p className="text-sm text-muted-foreground">Manage images and videos</p></div>
        <Button onClick={() => setCreating(!creating)}><Plus className="mr-2 h-4 w-4" /> Add Media</Button>
      </div>

      {creating && (
        <Card className="mb-6 p-6 border-border/40">
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="image">Image</option><option value="video">Video</option>
                </select>
              </div>
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <Button onClick={handleAdd}>Add to Library</Button>
          </div>
        </Card>
      )}

      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden border-border/40">
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.url})` }} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                {item.ai_generated && <Badge className="absolute top-2 right-2" variant="secondary"><Bot className="h-3 w-3" /></Badge>}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">{item.category}</p>
              </div>
            </Card>
          ))}
          {media.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No media items yet.</p>}
        </div>
      )}
    </div>
  );
}
