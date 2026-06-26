import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CommentSection } from '@/components/comment-section';

export async function generateStaticParams() {
  const { data } = await supabase.from('news_articles').select('slug');
  return (data ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: article } = await supabase
    .from('news_articles')
    .select('title, excerpt, seo_title, meta_description, image_url, published_at, author')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!article) return { title: 'Article Not Found | DVSC' };

  return {
    title: article.seo_title || article.title,
    description: article.meta_description || article.excerpt,
    openGraph: {
      title: article.seo_title || article.title,
      description: article.meta_description || article.excerpt,
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.author],
      images: [{ url: article.image_url }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seo_title || article.title,
      description: article.meta_description || article.excerpt,
      images: [article.image_url],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { data: article } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!article) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.image_url,
    datePublished: article.published_at,
    author: { '@type': 'Organization', name: article.author },
    publisher: { '@type': 'Organization', name: 'DVSC Fan Portal' },
  };

  const { data: moreArticles } = await supabase
    .from('news_articles')
    .select('*')
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Button asChild variant="ghost" size="sm" className="mb-6 group">
        <Link href="/news">
          <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to News
        </Link>
      </Button>

      <article>
        <Badge variant="destructive" className="mb-4">{article.category}</Badge>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          {article.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" /> {article.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(article.published_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${article.image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="mt-8 prose prose-lg dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            {article.excerpt}
          </p>
          <div className="mt-4 text-foreground/90 leading-relaxed whitespace-pre-line">
            {article.content}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4 border-t border-border/40 pt-6">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share Article
          </Button>
        </div>
      </article>

      {/* Comments */}
      <CommentSection articleId={article.id} />

      {/* More Articles */}
      {moreArticles && moreArticles.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-6">More News</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {moreArticles.map((a) => (
              <Link key={a.id} href={`/news/${a.slug}`}>
                <Card className="group h-full overflow-hidden border-border/40 transition-all hover:border-primary/50 hover:-translate-y-1">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${a.image_url})` }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {a.title}
                    </h3>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
