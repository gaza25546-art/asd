'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Search, User, LogOut, Trophy, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/news', label: 'Latest News' },
  { href: '/fixtures', label: 'Fixtures & Results' },
  { href: '/table', label: 'League Table' },
  { href: '/squad', label: 'Squad' },
  { href: '/gallery', label: 'Fan Gallery' },
  { href: '/videos', label: 'Videos' },
  { href: '/forum', label: 'Community Forum' },
  { href: '/history', label: 'Club History' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'glass border-b border-border/40 shadow-lg'
          : 'bg-background/95 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold text-lg shadow-lg shadow-primary/30">
            DV
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-xl font-bold tracking-wide">DVSC</span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground -mt-1">
              Hajra Loki
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href
                  ? 'text-primary'
                  : 'text-foreground/80'
              )}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="hidden md:flex items-center">
              <Input
                autoFocus
                placeholder="Search..."
                className="w-48 h-9"
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className="cursor-pointer">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/predictions" className="cursor-pointer">Predictions</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden sm:flex">
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex h-16 items-center gap-2 border-b px-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold">
                  DV
                </div>
                <span className="font-display text-lg font-bold">DVSC</span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <Button asChild className="mt-2">
                    <Link href="/login">Sign In / Register</Link>
                  </Button>
                )}
                {user && (
                  <>
                    <Link
                      href="/notifications"
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                      Notifications
                    </Link>
                    <Link
                      href="/profile"
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/predictions"
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                      Predictions
                    </Link>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
