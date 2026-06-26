import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Camera } from 'lucide-react';

export const metadata = { title: 'Fan Gallery | DVSC' };

export default async function GalleryPage() {
  const { data: photos } = await supabase
    .from('gallery_photos')
    .select('*')
    .order('title');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
      <SectionHeader title="Fan Gallery" subtitle="Passion, pride, and the red and white army" />

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {(photos ?? []).map((photo, i) => (
          <div
            key={photo.id}
            className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl"
          >
            <div
              className="relative w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(${photo.image_url})`,
                aspectRatio: i % 3 === 0 ? '3/4' : i % 3 === 1 ? '1/1' : '4/3',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-center gap-2 text-white">
                  <Camera className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-bold">{photo.title}</p>
                    <p className="text-xs text-white/70">By {photo.author}</p>
                  </div>
                </div>
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-primary/80 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {photo.category}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
