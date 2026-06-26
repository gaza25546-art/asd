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
    supabase.from('news_articles').select('*').order('published_at', { ascending: false }).limit(4),
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
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(https://bordstudio.hu/wp-content/uploads/2019/05/debrecen_nagyerdei_stadion_16_fullHD.jpg)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
          <div className="absolute inset-0 bg-grid opacity-30" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="destructive" className="mb-4 animate-pulse-red">
              <Flame className="mr-1 h-3 w-3" /> Official Fan Portal
            </Badge>
            <h1 className="font-display text-5xl font-bold uppercase leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Debreceni <span className="text-gradient-red">VSC</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl">
              The ultimate online destination for DVSC supporters. News, matches, community, and everything Loki.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="group">
                <Link href="/news">
                  Latest News
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/forum">Join Community</Link>
              </Button>
            </div>
          </div>

          {/* Next Match Countdown */}
          {nextMatch && (
            <div className="mt-12 max-w-2xl rounded-2xl glass p-6 animate-fade-in-up">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Next Match
                </span>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-2xl font-bold">
                    DVSC vs {nextMatch.opponent}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(nextMatch.match_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {nextMatch.venue}
                    </span>
                  </div>
                </div>
                <Countdown targetDate={nextMatch.match_date} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Breaking News */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <SectionHeader
          title="Breaking News"
          subtitle="The latest from Nagyerdei Stadion"
          action={
            <Button asChild variant="ghost" size="sm" className="group">
              <Link href="/news">
                View All <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {news.map((article, i) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <Card className="group h-full overflow-hidden border-border/40 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${article.image_url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <Badge className="absolute left-3 top-3" variant="destructive">
                    {article.category}
                  </Badge>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(article.published_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Results + Upcoming Fixtures */}
      <section className="bg-card/30 border-y border-border/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Results */}
            <div>
              <SectionHeader title="Recent Results" />
              <div className="space-y-3">
                {recentResults.map((match) => {
                  const dvscWon = match.dvsc_score! > match.opponent_score!;
                  const dvscLost = match.dvsc_score! < match.opponent_score!;
                  return (
                    <Card key={match.id} className="flex items-center justify-between p-4 border-border/40 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-display font-bold text-sm ${
                          dvscWon ? 'bg-green-500/20 text-green-500' : dvscLost ? 'bg-red-500/20 text-red-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          {dvscWon ? 'W' : dvscLost ? 'L' : 'D'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">vs {match.opponent}</p>
                          <p className="text-xs text-muted-foreground">{match.competition}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl font-bold">
                          {match.dvsc_score} - {match.opponent_score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.home_away === 'home' ? 'H' : 'A'}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-4 group">
                <Link href="/fixtures">
                  All Fixtures <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Upcoming Fixtures */}
            <div>
              <SectionHeader title="Upcoming Matches" />
              <div className="space-y-3">
                {upcomingFixtures.slice(0, 4).map((match) => (
                  <Card key={match.id} className="flex items-center justify-between p-4 border-border/40 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">vs {match.opponent}</p>
                        <p className="text-xs text-muted-foreground">{match.competition}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(match.match_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(match.match_date).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-4 group">
                <Link href="/fixtures">
                  All Fixtures <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Players */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <SectionHeader
          title="Featured Players"
          subtitle="The stars of the current squad"
          action={
            <Button asChild variant="ghost" size="sm" className="group">
              <Link href="/squad">
                Full Squad <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {players.map((player) => (
            <Link key={player.id} href={`/squad`}>
              <Card className="group relative overflow-hidden border-border/40 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${player.image_url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 font-display text-sm font-bold text-primary-foreground">
                    {player.number}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xs uppercase tracking-widest text-primary/90">{player.position}</p>
                    <h3 className="font-display text-lg font-bold leading-tight">{player.name}</h3>
                    <div className="mt-2 flex gap-3 text-xs text-white/80">
                      <span>{player.goals} Goals</span>
                      <span>{player.assists} Assists</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Club Statistics */}
      <section className="relative overflow-hidden border-y border-border/40 bg-card/30">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
          <SectionHeader title="Club Statistics" subtitle="A century of DVSC history" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="glass p-6 text-center border-border/20">
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fan Gallery Preview */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <SectionHeader
          title="Fan Gallery"
          subtitle="Passion from the stands"
          action={
            <Button asChild variant="ghost" size="sm" className="group">
              <Link href="/gallery">
                View All <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {gallery.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${photo.image_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p className="absolute bottom-2 left-2 right-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {photo.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Match Day Poll */}
      {poll && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
          <Card className="overflow-hidden border-primary/30">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8">
                <Badge variant="destructive" className="mb-3">Match Day Poll</Badge>
                <h2 className="font-display text-2xl font-bold mb-2">{poll.question}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Have your say! Vote and see what other fans think.
                </p>
                <Button asChild>
                  <Link href="/fixtures">Vote Now</Link>
                </Button>
              </div>
              <div className="bg-primary/5 p-8 flex flex-col justify-center gap-3">
                {[
                  { label: poll.option_a, votes: poll.votes_a },
                  { label: poll.option_b, votes: poll.votes_b },
                  { label: poll.option_c, votes: poll.votes_c },
                ].map((opt, i) => {
                  const total = poll.votes_a + poll.votes_b + poll.votes_c;
                  const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Social Media Feed */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <SectionHeader title="Social Wall" subtitle="Follow the conversation" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { platform: 'Twitter', handle: '@DVSCOfficial', text: 'What a performance from the lads today! Three points at home. Hajra Loki!', time: '2h ago', icon: 'T' },
            { platform: 'Instagram', handle: '@dvsc.official', text: 'Match day atmosphere at Nagyerdei Stadion was electric tonight.', time: '5h ago', icon: 'I' },
            { platform: 'Facebook', handle: 'DVSC Official', text: 'Tickets for the Ferencvaros match are now on sale. Season ticket holders get priority.', time: '1d ago', icon: 'F' },
          ].map((post, i) => (
            <Card key={i} className="p-5 border-border/40 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {post.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{post.handle}</p>
                  <p className="text-xs text-muted-foreground">{post.platform} - {post.time}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{post.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative overflow-hidden border-t border-border/40 bg-card/30">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-16 lg:px-8 text-center">
          <Newspaper className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="font-display text-3xl font-bold uppercase mb-2">Join the Newsletter</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Get the latest DVSC news, match updates, and exclusive content delivered straight to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
