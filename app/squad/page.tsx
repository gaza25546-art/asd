import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyncButton } from '@/components/sync-button';

export const metadata = { title: 'Squad | DVSC' };

export default async function SquadPage() {
  const { data: players } = await supabase
    .from('squad_players')
    .select('*')
    .order('name', { ascending: true });

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Winger', 'Striker'];
  const grouped: Record<string, typeof players> = {};

  positions.forEach((pos) => {
    grouped[pos] = (players ?? []).filter((p) => p.position === pos);
  });

  // Also group defenders more broadly
  const defenders = (players ?? []).filter((p) =>
    p.position?.includes('Back') || p.position === 'Centre Back' || p.position === 'Defender'
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="First Team Squad" subtitle="The players representing DVSC" />
        <SyncButton entity="squad" />
      </div>

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
    return <p className="text-muted-foreground text-sm">No players in this category. Click Sync to fetch data.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {players.map((player) => (
        <Card key={player.id} className="group relative overflow-hidden border-border/40 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1">
          <div className="relative aspect-[3/4] overflow-hidden">
            {player.player_image_url ? (
              <img
                src={player.player_image_url}
                alt={player.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-muted to-muted/50 flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-muted-foreground/30">
                  {(player.name?.[0] ?? 'D').toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 font-display text-base font-bold text-primary-foreground shadow-lg">
              {player.number ?? '?'}
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <Badge variant="destructive" className="mb-1 text-[10px]">{player.position}</Badge>
              <h3 className="font-display text-base font-bold leading-tight text-white">{player.name}</h3>
              <p className="text-xs text-white/70">{player.nationality}</p>
              <div className="mt-2 flex gap-3 text-xs text-white/80">
                <span>{player.goals}G</span>
                <span>{player.assists}A</span>
                <span>{player.appearances}APP</span>
              </div>
              {(player.height || player.weight) && (
                <div className="mt-1 flex gap-2 text-[10px] text-white/50">
                  {player.height && <span>{player.height}</span>}
                  {player.weight && <span>{player.weight}</span>}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
