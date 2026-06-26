'use client';

import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email });
      if (error) {
        if (error.code === '23505') {
          toast.info('You are already subscribed!');
          setSubscribed(true);
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      } else {
        toast.success('Welcome to the DVSC family! Check your inbox.');
        setSubscribed(true);
        setEmail('');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-3 rounded-lg glass px-6 py-4">
        <CheckCircle2 className="h-6 w-6 text-green-500" />
        <p className="text-sm font-medium">You are subscribed! Hajra Loki!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          required
        />
      </div>
      <Button type="submit" disabled={loading} size="lg">
        {loading ? 'Subscribing...' : 'Subscribe'}
      </Button>
    </form>
  );
}
