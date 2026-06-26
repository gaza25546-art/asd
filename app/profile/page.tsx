'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Trophy, MessageSquare, Target } from 'lucide-react';

interface Profile {
  display_name: string;
  favorite_player: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ comments: 0, predictions: 0, topics: 0 });
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [favoritePlayer, setFavoritePlayer] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, favorite_player, bio, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name);
      setFavoritePlayer(data.favorite_player ?? '');
      setBio(data.bio ?? '');
    } else {
      // Create profile if doesn't exist
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: user.id, display_name: user.email?.split('@')[0] ?? 'DVSC Fan' })
        .select('display_name, favorite_player, bio, avatar_url')
        .maybeSingle();
      if (newProfile) {
        setProfile(newProfile);
        setDisplayName(newProfile.display_name);
      }
    }
  };

  const loadStats = async () => {
    if (!user) return;
    const [comments, predictions, topics] = await Promise.all([
      supabase.from('comments').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('match_predictions').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('forum_topics').select('id', { count: 'exact' }).eq('user_id', user.id),
    ]);
    setStats({
      comments: comments.count ?? 0,
      predictions: predictions.count ?? 0,
      topics: topics.count ?? 0,
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        favorite_player: favoritePlayer,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to update profile.');
    } else {
      toast.success('Profile updated!');
      setEditing(false);
      loadProfile();
    }
    setSaving(false);
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

      {/* Profile Header */}
      <Card className="p-6 mb-6 border-border/40">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground font-display text-2xl font-bold">
              {(profile?.display_name ?? 'D')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">{profile?.display_name ?? 'DVSC Fan'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center border-border/40">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="font-display text-2xl font-bold">{stats.comments}</p>
          <p className="text-xs text-muted-foreground">Comments</p>
        </Card>
        <Card className="p-4 text-center border-border/40">
          <Target className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="font-display text-2xl font-bold">{stats.predictions}</p>
          <p className="text-xs text-muted-foreground">Predictions</p>
        </Card>
        <Card className="p-4 text-center border-border/40">
          <User className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="font-display text-2xl font-bold">{stats.topics}</p>
          <p className="text-xs text-muted-foreground">Forum Posts</p>
        </Card>
      </div>

      {/* Edit Form */}
      {editing ? (
        <Card className="p-6 border-border/40">
          <h3 className="font-display text-lg font-bold mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="favoritePlayer">Favorite Player</Label>
              <Input id="favoritePlayer" value={favoritePlayer} onChange={(e) => setFavoritePlayer(e.target.value)} placeholder="e.g. Barbu Bence" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell other fans about yourself..." />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 border-border/40">
          <h3 className="font-display text-lg font-bold mb-4">About Me</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Favorite Player</p>
              <p className="text-sm font-medium">{profile?.favorite_player || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Bio</p>
              <p className="text-sm">{profile?.bio || 'No bio yet. Click Edit to add one!'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
