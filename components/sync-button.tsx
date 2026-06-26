'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SyncButtonProps {
  entity?: 'fixtures' | 'standings' | 'squad' | 'all';
}

export function SyncButton({ entity = 'all' }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/sync-thesportsdb?entity=${entity}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sync failed');

      toast.success(`Synced ${entity} successfully!`);
      // Reload page to show fresh data
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync data');
    }
    setSyncing(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync'}
    </Button>
  );
}
