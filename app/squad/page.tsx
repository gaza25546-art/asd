import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata = { title: 'Squad | DVSC' };

export default async function SquadPage() {
  const { data: players } = await supabase
    .from('squad_players')
    .select('*')
    .order('number', { ascending: true });

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Winger', 'Striker'];
  const grouped: Record<string, typeof players> = {};

  positions.forEach((pos) => {
    grouped[pos] = (players ?? []).filter((p) => p.position === pos);
  });
  // Group defenders (Right Back, Centre Back, Left Back)
  const defenders = (players ?? []).filter((p) =>
    p.position.includes('Back') || p.position === 'Centre Back'
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
      <SectionHeader title="First Team Squad" subtitle="The players representing DVSC" />

      <Tabs defaultValue="all">
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="gk">Goalkeepers</TabsTrigger>
          <TabsTrigger value="def">Defenders</TabsTrigger>
          <TabsTrigger value="mid">Midfielders</TabsTrigger>
          <TabsTrigger value="fwd">Forwards</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PlayerGrid players={players ?? []} />
        </TabsContent>
        <TabsContent value="gk">
          <PlayerGrid players={grouped['Goalkeeper'] ?? []} />
        </TabsContent>
        <TabsContent value="def">
          <PlayerGrid players={defenders} />
        </TabsContent>
        <TabsContent value="mid">
          <PlayerGrid players={[...(grouped['Midfielder'] ?? []), ...(grouped['Winger'] ?? [])]} />
        </TabsContent>
        <TabsContent value="fwd">
          <PlayerGrid players={grouped['Striker'] ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlayerGrid({ players }: { players: any[] }) {
  if (players.length === 0) {
    return <p className="text-muted-foreground text-sm">No players in this category.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {players.map((player) => (
        <Card key={player.id} className="group relative overflow-hidden border-border/40 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1">
          <div className="relative aspect-[3/4] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${player.image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 font-display text-base font-bold text-primary-foreground shadow-lg">
              {player.number}
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <Badge variant="destructive" className="mb-1 text-[10px]">{player.position}</Badge>
              <h3 className="font-display text-base font-bold leading-tight">{player.name}</h3>
              <p className="text-xs text-white/70">{player.nationality}</p>
              <div className="mt-2 flex gap-3 text-xs text-white/80">
                <span>{player.goals}G</span>
                <span>{player.assists}A</span>
                <span>{player.appearances}APP</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
