'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, Newspaper, Users, MessageSquare, Calendar,
  BarChart3, Vote, Mail, Image, Bot, Bell, FileText, Settings,
  LogOut, Menu, X, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['editor', 'moderator', 'super_admin'] },
  { href: '/admin/news', label: 'News Management', icon: Newspaper, roles: ['editor', 'super_admin'] },
  { href: '/admin/ai-approvals', label: 'AI Approvals', icon: Bot, roles: ['editor', 'super_admin'] },
  { href: '/admin/users', label: 'User Management', icon: Users, roles: ['super_admin'] },
  { href: '/admin/forum', label: 'Forum Moderation', icon: MessageSquare, roles: ['moderator', 'super_admin'] },
  { href: '/admin/matches', label: 'Match Management', icon: Calendar, roles: ['editor', 'super_admin'] },
  { href: '/admin/polls', label: 'Poll Management', icon: Vote, roles: ['editor', 'super_admin'] },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail, roles: ['editor', 'super_admin'] },
  { href: '/admin/media', label: 'Media Library', icon: Image, roles: ['editor', 'super_admin'] },
  { href: '/admin/notifications', label: 'Push Notifications', icon: Bell, roles: ['editor', 'super_admin'] },
];

const footerNav = [
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['editor', 'moderator', 'super_admin'] },
  { href: '/admin/audit', label: 'Audit Logs', icon: Shield, roles: ['super_admin'] },
  { href: '/admin/automation', label: 'Automation Logs', icon: FileText, roles: ['super_admin'] },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const visibleNav = adminNav.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/40 bg-card px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
            DV
          </div>
          <span className="font-display font-bold">Admin</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col transform border-r border-border/40 bg-card transition-transform lg:sticky lg:top-0 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo */}
          <div className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-border/40 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold">
              DV
            </div>
            <div>
              <p className="font-display font-bold leading-none">DVSC Admin</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          </div>

          {/* Scrollable main nav */}
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Pinned footer */}
          <div className="flex-shrink-0 border-t border-border/40 p-3">
            <div className="flex flex-col gap-1">
              {footerNav.filter((item) => item.roles.includes(role)).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="my-3 border-t border-border/40" />
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              Back to Site
            </Link>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Helper to log admin actions
export async function logAdminAction(action: string, targetTable?: string, targetId?: string, details?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  await supabase.from('audit_logs').insert({
    admin_id: session.user.id,
    action,
    target_table: targetTable,
    target_id: targetId,
    details: details ?? null,
  });
}
