import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Trophy, Users, TrendingUp, Flame, Newspaper, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Countdown } from '@/components/countdown';
import { Counter } from '@/components/counter';
import { SectionHeader } from '@/components/section-header';
import { NewsletterForm } from '@/components/newsletter-form';
import { supabase } from '@/lib/supabase';

async function getHomeData() {
  const [news, fixtures, players, gallery, polls] = await Promise.all([
    supabase.from('news_articles').select('*').order('approved_at', { ascending: false }).limit(4),
    supabase.from('fixtures').select('*').order('match_date', { ascending: true }),
    supabase.from('squad_players').select('*').order('goals', { ascending: false }).limit(4),
    supabase.from('gallery_photos').select('*').limit(6),
    supabase.from('polls').select('*').limit(1),
  ]);

  return {
    news: news.data ?? [],
    fixtures: fixtures.data ?? [],
    players: players.data ?? [],
    gallery: gallery.data ?? [],
    poll: polls.data?.[0] ?? null,
  };
}

export default async function Home() {
  const { news, fixtures, players, gallery, poll } = await getHomeData();

  const upcomingFixtures = fixtures.filter((f) => f.status === 'scheduled');
  const completedFixtures = fixtures.filter((f) => f.status === 'finished');
  const nextMatch = upcomingFixtures[0];
  const recentResults = completedFixtures.slice(0, 4);

  const stats = [
    { label: 'Founded', value: 1902, suffix: '', icon: Trophy },
    { label: 'League Titles', value: 3, suffix: '', icon: Trophy },
    { label: 'Cup Wins', value: 6, suffix: '', icon: Trophy },
    { label: 'Stadium Capacity', value: 20000, suffix: '', icon: Users },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1577223625816-7546f13f4e2c?w=1920&q=80)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>

        <div className="container relative z-10 py-20">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
              <Flame className="mr-1 h-3 w-3" /> DVSC Fan Portal
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Debreceni <span className="text-primary">Vasutas</span> Sport Club
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              The official fan portal for Loki supporters. Latest news, match updates, squad info, and community features.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/news">
                  Latest News <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/fixtures">Fixtures</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Next Match */}
      {nextMatch && (
        <section className="py-16 bg-muted/30">
          <div className="container">
            <SectionHeader title="Next Match" />
            <Card className="p-8 border-border/40 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">DVSC</p>
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <span className="font-display text-2xl font-bold text-primary">DVSC</span>
                  </div>
                </div>
                <div className="text-center">
                  <Countdown targetDate={nextMatch.match_date} />
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(nextMatch.match_date).toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    <MapPin className="mr-1 h-3 w-3" /> {nextMatch.venue}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">{nextMatch.opponent}</p>
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Latest News */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader title="Latest News" />
            <Button variant="ghost" asChild>
              <Link href="/news">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {news.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`} className="group">
                <Card className="overflow-hidden border-border/40 h-full transition-all hover:shadow-lg hover:border-primary/20">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.image_url || '/placeholder.svg'}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(article.approved_at || article.published_at).toLocaleDateString('hu-HU', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <SectionHeader title="Club Stats" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 text-center border-border/40">
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <Counter end={stat.value} suffix={stat.suffix} />
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <section className="py-16">
          <div className="container">
            <SectionHeader title="Recent Results" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {recentResults.map((match) => (
                <Card key={match.id} className="p-4 border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-bold text-sm text-primary">DVSC</span>
                    </div>
                    <span className="font-bold">{match.dvsc_score}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-bold">{match.opponent_score}</span>
                    <span className="text-sm text-muted-foreground">{match.opponent}</span>
                  </div>
                  <Badge variant={match.dvsc_score > match.opponent_score ? 'default' : 'destructive'}>
                    {match.dvsc_score > match.opponent_score ? 'W' : match.dvsc_score < match.opponent_score ? 'L' : 'D'}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Scorers */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <SectionHeader title="Top Scorers" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {players.map((player) => (
              <Card key={player.id} className="p-4 border-border/40 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center overflow-hidden">
                  {player.image_url ? (
                    <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold">{player.name}</p>
                <p className="text-sm text-muted-foreground">{player.position}</p>
                <Badge className="mt-2">{player.goals} goals</Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader title="Gallery" />
            <Button variant="ghost" asChild>
              <Link href="/gallery">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((photo) => (
              <Link key={photo.id} href="/gallery" className="group relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-4">
                  <p className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-2xl text-center">
          <SectionHeader title="Stay Updated" />
          <p className="text-muted-foreground mb-6">
            Subscribe to our newsletter for the latest DVSC news, match updates, and exclusive content.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
