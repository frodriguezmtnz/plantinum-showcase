import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { auth } from '@/auth';
import { getPlatinumsForSameGame, getUsersByIds } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';

interface RelatedPlatinumsProps {
  platinumId: string;
  gameId: number | null;
  gameName: string;
}

/**
 * "More platinums for this game" rail on the detail page. Uses the RAWG
 * `gameId` when the plate is linked so different spellings of the same game
 * still meet, with an exact-name fallback for unlinked plates.
 */
export async function RelatedPlatinums({
  platinumId,
  gameId,
  gameName,
}: RelatedPlatinumsProps) {
  const session = await auth();
  const plates = await getPlatinumsForSameGame(
    { gameId, gameName },
    platinumId,
    session?.user?.id,
  );
  if (plates.length === 0) return null;

  const users = await getUsersByIds(plates.map((plate) => plate.userId));
  const usersById = new Map(users.map((user) => [user.id, user]));

  return (
    <section aria-labelledby="same-game-heading" className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="same-game-heading"
            className="text-2xl font-bold font-headline"
          >
            More platinums for this game
          </h2>
          <p className="text-sm text-muted-foreground">
            Other hunters who platinumed {gameName}.
          </p>
        </div>
        <Link
          href={`/explore?q=${encodeURIComponent(gameName)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          See all
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plates.map((plate) => (
          <PlatinumCard
            key={plate.id}
            platinum={plate}
            user={usersById.get(plate.userId)}
          />
        ))}
      </div>
    </section>
  );
}
