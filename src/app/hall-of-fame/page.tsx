
import { redirect } from 'next/navigation';
import {
  getFollowingMonthlyRanking,
  getMonthlyRanking,
  getUsersByIds,
  type User,
} from '@/lib/data';
import {
  getHunterLeaderboard,
  getViewerHunterStanding,
} from '@/lib/hunter-rankings';
import { auth } from '@/auth';
import { Trophy, Award, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { HunterLeaderboard } from '@/components/hall-of-fame/hunter-leaderboard';
import { cn, isStoredImage } from '@/lib/utils';

export const metadata = {
  title: 'Hall of Fame | Platinum Showcase',
  alternates: { canonical: '/hall-of-fame' },
};

function daysUntilMonthEnd(now: Date): number {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

type Props = {
  searchParams: Promise<{ scope?: string; board?: string }>;
};

export default async function HallOfFamePage({ searchParams }: Props) {
  const { scope: rawScope, board: rawBoard } = await searchParams;
  const scope = rawScope === 'circle' ? 'circle' : 'global';
  const board = rawBoard === 'hunters' ? 'hunters' : 'plates';
  const isHunterBoard = board === 'hunters';

  const session = await auth();
  const userId = session?.user?.id;

  // "My circle" is per-account; anonymous visitors sign in first.
  if (scope === 'circle' && !userId) {
    redirect(
      `/login?callbackUrl=/hall-of-fame%3F${
        isHunterBoard ? 'board%3Dhunters%26' : ''
      }scope%3Dcircle`,
    );
  }

  const [rankedPlatinums, hunterBoard, hunterStanding] = await Promise.all([
    isHunterBoard
      ? Promise.resolve([])
      : scope === 'circle'
        ? getFollowingMonthlyRanking(userId!, 10, userId)
        : getMonthlyRanking(10, userId),
    isHunterBoard
      ? getHunterLeaderboard({ scope, viewerId: userId })
      : Promise.resolve(null),
    isHunterBoard && userId
      ? getViewerHunterStanding(userId)
      : Promise.resolve(null),
  ]);
  const users = await getUsersByIds(rankedPlatinums.map((p) => p.userId));

  const getUserById = (userId: string): User | undefined => users.find(u => u.id === userId);

  const now = new Date();
  const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysLeft = daysUntilMonthEnd(now);

  const podiumPlatinums = rankedPlatinums.slice(0, 3);
  const otherRankedPlatinums = rankedPlatinums.slice(3);

  // Podium metal in the field's own inks: sunrise gold, console blue, ember bronze.
  const podiumStyles: Record<1 | 2 | 3, {
    borderColor: string;
    textColor: string;
    bgColor: string;
    shadowClass: string;
    order: string;
    lift: string;
    rankText: string;
    shine: string;
    mobileScale: string;
  }> = {
    1: {
      borderColor: 'ring-2 ring-dusk-bright/65',
      textColor: 'text-[hsl(30_72%_32%)]',
      bgColor: 'bg-[hsl(44_92%_90%/0.8)]',
      shadowClass: 'shadow-champion',
      order: 'md:order-2',
      lift: 'md:-translate-y-28',
      rankText: 'Champion',
      shine: 'hsl(44 92% 72% / 0.7)',
      mobileScale: 'scale-[1.03]',
    },
    2: {
      borderColor: 'ring-1 ring-[hsl(211_30%_55%/0.5)]',
      textColor: 'text-[hsl(211_45%_32%)]',
      bgColor: 'bg-[hsl(206_45%_94%/0.85)]',
      shadowClass: '',
      order: 'md:order-1',
      lift: 'md:-translate-y-8',
      rankText: '2nd Place',
      shine: 'hsl(206 55% 82% / 0.65)',
      mobileScale: 'scale-[1.015]',
    },
    3: {
      borderColor: 'ring-1 ring-[hsl(24_55%_45%/0.5)]',
      textColor: 'text-[hsl(24_60%_34%)]',
      bgColor: 'bg-[hsl(28_65%_93%/0.85)]',
      shadowClass: '',
      order: 'md:order-3',
      lift: '',
      rankText: '3rd Place',
      shine: 'hsl(28 70% 72% / 0.65)',
      mobileScale: '',
    },
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-16">
        <Award className="mx-auto h-14 w-14 text-dusk" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline mt-2 text-balance">Monthly Hall of Fame</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          {isHunterBoard
            ? scope === 'circle'
              ? `The trophy hunters your circle is voting for in ${monthYear.toLowerCase()}.`
              : `The trophy hunters earning the most votes in ${monthYear.toLowerCase()}.`
            : scope === 'circle'
              ? `The favorites among the trophy hunters you follow in ${monthYear.toLowerCase()}.`
              : `The community's favorite platinum screenshots of ${monthYear.toLowerCase()}.`}
        </p>
        <p className="field-mark mt-3">
          {daysLeft === 0 ? (
            <span>Final day of voting</span>
          ) : (
            <>The polls close in <span className="tabular font-semibold text-foreground">{daysLeft}</span> {daysLeft === 1 ? 'day' : 'days'}</>
          )}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex rounded-full border border-border/70 bg-background/40 p-0.5 text-xs">
            <Link
              href={
                scope === 'circle'
                  ? '/hall-of-fame?scope=circle'
                  : '/hall-of-fame'
              }
              aria-current={!isHunterBoard ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-colors',
                !isHunterBoard
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Award className="h-3.5 w-3.5" aria-hidden />
              Platinums
            </Link>
            <Link
              href={
                scope === 'circle'
                  ? '/hall-of-fame?board=hunters&scope=circle'
                  : '/hall-of-fame?board=hunters'
              }
              aria-current={isHunterBoard ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-colors',
                isHunterBoard
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Users className="h-3.5 w-3.5" aria-hidden />
              Trophy hunters
            </Link>
          </div>
          <div className="inline-flex rounded-full border border-border/70 bg-background/40 p-0.5 text-xs">
            <Link
              href={
                isHunterBoard ? '/hall-of-fame?board=hunters' : '/hall-of-fame'
              }
              aria-current={scope === 'global' ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-colors',
                scope === 'global'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Trophy className="h-3.5 w-3.5" aria-hidden />
              Global
            </Link>
            <Link
              href={
                isHunterBoard
                  ? '/hall-of-fame?board=hunters&scope=circle'
                  : '/hall-of-fame?scope=circle'
              }
              aria-current={scope === 'circle' ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-colors',
                scope === 'circle'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Users className="h-3.5 w-3.5" aria-hidden />
              My circle
            </Link>
          </div>
        </div>
      </div>

      {isHunterBoard && hunterBoard ? (
        <HunterLeaderboard
          items={hunterBoard.items}
          total={hunterBoard.total}
          standing={hunterStanding}
          scope={scope}
          isSignedIn={Boolean(userId)}
          periodLabel={monthYear.toLowerCase()}
        />
      ) : rankedPlatinums.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border p-12 text-center">
          {scope === 'circle' ? (
            <>
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-headline text-xl font-bold">No votes in your circle yet.</h2>
              <p className="mt-2 text-muted-foreground">
                Follow trophy hunters to build your circle, or vote on the freshest platinums so your favorites climb the board.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Explore and follow trophy hunters
              </Link>
            </>
          ) : (
            <>
              <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-headline text-xl font-bold">The podium is empty this month.</h2>
              <p className="mt-2 text-muted-foreground">Vote on the freshest platinums or upload your own — the first champion of {monthYear} is undecided.</p>
            </>
          )}
        </div>
      ) : (
        <>
      {/* Podium Section */}
      {podiumPlatinums.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-end max-w-5xl mx-auto mb-30 pt-16">
          {podiumPlatinums.map((platinum, index) => {
            const rank = (index + 1) as 1 | 2 | 3;
            const user = getUserById(platinum.userId);
            const styles = podiumStyles[rank];

            return (
              <div key={platinum.id} className={cn('flex flex-col items-center transform transition-transform', styles.order, styles.lift, styles.mobileScale, 'md:scale-100')}>
                <h2 className={cn('field-mark mb-2', styles.textColor)}>{styles.rankText}</h2>
                <Link href={`/platinum/${platinum.id}`} className="w-full outline-none transition-transform duration-300 focus-visible:scale-[1.02]">
                  <Card
                    style={{ ['--shine' as string]: styles.shine }}
                    className={cn(
                      "panel-solid group relative overflow-hidden text-center rounded-xl transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_28px_-6px_var(--shine)] focus-visible:shadow-bloom",
                      styles.borderColor,
                      styles.bgColor,
                      styles.shadowClass
                    )}
                  >
                    <span className="podium-shine" aria-hidden />
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={platinum.imageUrl}
                        alt={`Screenshot for ${platinum.gameName}`}
                        fill
                        sizes="(max-width: 768px) 90vw, 30vw"
                        className="object-cover"
                        data-ai-hint={platinum.imageHint}
                        unoptimized={isStoredImage(platinum.imageUrl)}
                      />
                    </div>
                    <CardContent className="p-4">
                      {user && (
                        <div className="flex items-center justify-center gap-2">
                          <Avatar className="h-8 w-8 border-2" style={{ borderColor: rank === 1 ? 'hsl(38 88% 45% / 0.8)' : undefined }}>
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold truncate">{user.username}</span>
                        </div>
                      )}
                      <h3 className={cn("font-medium mt-2 truncate text-lg", rank === 1 && "font-headline font-bold text-[hsl(30_72%_30%)]")}>{platinum.gameName}</h3>
                      <div className={cn('flex items-center justify-center gap-2 font-bold mt-2', styles.textColor)}>
                        <span className="tabular">{platinum.monthlyVotes}</span>
                        <Trophy className="w-5 h-5" />
                        <span className="font-medium">Monthly Votes</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Other Rankings */}
      {otherRankedPlatinums.length > 0 && (
         <div className="max-w-4xl mx-auto">
          <h2 className="mb-6 text-center font-headline text-2xl font-bold">
            Rest of the Top 10
          </h2>
          <ul className="space-y-4">
            {otherRankedPlatinums.map((platinum, index) => {
              const user = getUserById(platinum.userId);
              const rank = index + 4;
              
              return (
                <li key={platinum.id}>
                  <Link href={`/platinum/${platinum.id}`} className="block rounded-xl outline-none transition-shadow duration-300 focus-visible:shadow-bloom">
                    <Card className="panel-solid p-3 sm:p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:bg-popover hover:shadow-bloom">
                      <div className={`text-2xl sm:text-3xl font-bold w-12 text-center shrink-0 text-muted-foreground tabular`}>#{rank}</div>
                      <Image 
                        src={platinum.imageUrl} 
                        alt={`Screenshot for ${platinum.gameName}`} 
                        width={128} 
                        height={72}
                        className="w-24 sm:w-32 h-14 sm:h-18 object-cover rounded-md" 
                        data-ai-hint={platinum.imageHint} 
                        unoptimized={isStoredImage(platinum.imageUrl)} 
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{platinum.gameName}</h3>
                        {user && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={user.avatarUrl} alt={user.username} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{user.username}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end text-right shrink-0">
                        <div className="flex items-center gap-2 text-base font-bold text-live tabular sm:text-lg">
                          <span>{platinum.monthlyVotes}</span>
                          <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="hidden text-xs text-muted-foreground sm:block">Monthly Votes</span>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
        </>
      )}
    </div>
  );
}
