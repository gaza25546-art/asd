'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Shield } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs(data ?? []);
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">Track all admin actions for security and compliance</p>
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <Card className="border-border/40">
          {logs.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No audit logs yet.</p> : (
            <div className="divide-y divide-border/20">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.target_table ? `Table: ${log.target_table}` : ''}
                        {log.target_id ? ` | ID: ${log.target_id.slice(0, 8)}...` : ''}
                      </p>
                      {log.details && (
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                          {JSON.stringify(log.details)}
                        </pre>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleString('en-GB')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
