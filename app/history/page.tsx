import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';

export const metadata = { title: 'Club History | DVSC' };

export default async function HistoryPage() {
  const [{ data: timeline }, { data: trophies }, { data: legends }] = await Promise.all([
    supabase.from('history_timeline').select('*').order('year', { ascending: true }),
    supabase.from('trophies').select('*').order('season', { ascending: false }),
    supabase.from('legendary_players').select('*'),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 lg:px-8">
      {/* Header */}
      <div className="relative mb-12 overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.pexels.com/photos/47730/the-ball-stadion-football-the-pitch-47730.jpeg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="relative p-8 sm:p-12">
          <Badge variant="destructive" className="mb-3">Est. 1902</Badge>
          <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">Club History</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Over a century of passion, pride, and the red and white of Debrecen.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <SectionHeader title="History Timeline" subtitle="Key moments in DVSC history" />
      <div className="relative mb-16">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/30 sm:left-1/2" />
        <div className="space-y-8">
          {(timeline ?? []).map((item, i) => (
            <div
              key={item.id}
              className={`relative flex items-center gap-6 ${
                i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
              }`}
            >
              <div className="absolute left-4 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground sm:left-1/2">
                <span className="text-xs font-bold">{item.year.slice(-2)}</span>
              </div>
              <div className="ml-12 w-full sm:ml-0 sm:w-1/2 sm:px-8">
                <Card className="overflow-hidden border-border/40 transition-all hover:border-primary/30 hover:-translate-y-1">
                  {item.image_url && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <Badge variant="destructive" className="mb-2">{item.year}</Badge>
                    <h3 className="font-display text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </Card>
              </div>
              <div className="hidden sm:block sm:w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Trophy Cabinet */}
      <SectionHeader title="Trophy Cabinet" subtitle="Silverware won by DVSC" />
      <div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(trophies ?? []).map((trophy) => (
          <Card key={trophy.id} className="group relative overflow-hidden border-border/40 p-6 text-center transition-all hover:border-primary/50 hover:-translate-y-1">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="font-display text-sm font-bold">{trophy.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{trophy.competition}</p>
            <Badge variant="outline" className="mt-2 text-[10px]">{trophy.season}</Badge>
          </Card>
        ))}
      </div>

      {/* Legendary Players */}
      <SectionHeader title="Legendary Players" subtitle="The icons who shaped DVSC" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(legends ?? []).map((legend) => (
          <Card key={legend.id} className="group overflow-hidden border-border/40 transition-all hover:border-primary/50 hover:-translate-y-1">
            <div className="relative aspect-[4/3] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${legend.image_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge variant="destructive" className="mb-1 text-[10px]">{legend.years}</Badge>
                <h3 className="font-display text-lg font-bold text-white">{legend.name}</h3>
                <p className="text-xs text-white/70">{legend.position}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground line-clamp-3">{legend.bio}</p>
              {legend.achievements && (
                <p className="mt-3 text-xs font-medium text-primary">{legend.achievements}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
