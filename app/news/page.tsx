import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Calendar, User } from 'lucide-react';

export const metadata = { title: 'Latest News | DVSC' };

export default async function NewsPage() {
  const { data: articles } = await supabase
    .from('news_articles')
    .select('*')
    .order('approved_at', { ascending: false });

  const featured = articles?.[0];
  const rest = articles?.slice(1) ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
      <SectionHeader title="Latest News" subtitle="All the latest from DVSC" />

      {/* Featured Article */}
      {featured && (
        <Link href={`/news/${featured.slug}`} className="block mb-8">
          <Card className="group grid grid-cols-1 overflow-hidden border-border/40 transition-all hover:border-primary/50 lg:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${featured.image_url})` }}
              />
              <Badge className="absolute left-4 top-4" variant="destructive">
                Featured
              </Badge>
            </div>
            <div className="flex flex-col justify-center p-8">
              <Badge variant="outline" className="mb-3 w-fit">{featured.category}</Badge>
              <h2 className="font-display text-2xl font-bold leading-tight group-hover:text-primary transition-colors sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> {featured.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(featured.approved_at || featured.published_at).toLocaleDateString('hu-HU', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Article Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((article) => (
          <Link key={article.id} href={`/news/${article.slug}`}>
            <Card className="group h-full overflow-hidden border-border/40 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
              <div className="relative aspect-[4/3] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${article.image_url})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute left-3 top-3" variant="destructive">
                  {article.category}
                </Badge>
              </div>
              <div className="p-5">
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(article.approved_at || article.published_at).toLocaleDateString('hu-HU', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
                <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {article.excerpt}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
