'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import { Search, Shield, Star } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  email?: string;
  role: string;
  prediction_score: number;
  forum_reputation: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, role, prediction_score, forum_reputation, created_at')
      .order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  };

  const handleRoleChange = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) toast.error('Failed to update role.');
    else {
      toast.success(`Role updated to ${role}.`);
      logAdminAction('change_user_role', 'profiles', id, { role });
      loadUsers();
    }
  };

  const filtered = users.filter((u) =>
    u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card key={user.id} className="flex items-center justify-between p-4 border-border/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {user.display_name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {user.prediction_score} pts</span>
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {user.forum_reputation} rep</span>
                    <span>{new Date(user.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'user' ? 'outline' : 'default'}>
                  {user.role}
                </Badge>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="moderator">Moderator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
