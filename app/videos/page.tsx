import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Play, Clock } from 'lucide-react';

export const metadata = { title: 'Videos | DVSC' };

export default async function VideosPage() {
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false });

  const featured = (videos ?? [])[0];
  const rest = (videos ?? []).slice(1);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
      <SectionHeader title="Videos" subtitle="Highlights, interviews, and fan content" />

      {/* Featured Video */}
      {featured && (
        <div className="mb-8">
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${featured.thumbnail})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 transition-transform hover:scale-110 cursor-pointer">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Badge variant="destructive" className="mb-2">{featured.category}</Badge>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{featured.title}</h2>
              <p className="mt-1 text-sm text-white/80">{featured.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((video) => (
          <Card key={video.id} className="group overflow-hidden border-border/40 transition-all hover:border-primary/50 hover:-translate-y-1">
            <div className="relative aspect-video overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${video.thumbnail})` }}
              />
              <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 transition-transform group-hover:scale-110">
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                <Clock className="h-3 w-3" /> {video.duration}
              </div>
            </div>
            <div className="p-4">
              <Badge variant="outline" className="mb-2 text-[10px]">{video.category}</Badge>
              <h3 className="font-display text-base font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {video.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{video.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
