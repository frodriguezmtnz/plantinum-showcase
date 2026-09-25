
import { getMonthlyRanking, getUsers, type User } from '@/lib/data';
import { auth } from '@/auth';
import { Trophy, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn, isStoredImage } from '@/lib/utils';

export const metadata = {
  title: 'Hall of Fame | Platinum Showcase',
};

function daysUntilMonthEnd(now: Date): number {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export default async function HallOfFamePage() {
  const session = await auth();
  const [rankedPlatinums, users] = await Promise.all([
    getMonthlyRanking(10, session?.user?.id),
    getUsers(),
  ]);

  const getUserById = (userId: string): User | undefined => users.find(u => u.id === userId);

  const now = new Date();
  const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysLeft = daysUntilMonthEnd(now);

  const podiumPlatinums = rankedPlatinums.slice(0, 3);
  const otherRankedPlatinums = rankedPlatinums.slice(3);

  // Define styles for podium places
  const podiumStyles: Record<1 | 2 | 3, {
    borderColor: string;
    textColor: string;
    bgColor: string;
    shadowClass: string;
    order: string;
    lift: string;
    rankText: string;
  }> = {
    1: {
      borderColor: 'platinum-edge',
      textColor: 'text-platinum-bright',
      bgColor: 'platinum-plate',
      shadowClass: 'shadow-champion hover:shadow-champion',
      order: 'md:order-2',
      lift: 'md:-translate-y-12',
      rankText: 'Champion',
    },
    2: {
      borderColor: 'border-gray-400',
      textColor: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      shadowClass: 'hover:shadow-2xl hover:shadow-gray-400/30 focus-visible:shadow-gray-400/30',
      order: 'md:order-1',
      lift: 'md:-translate-y-6',
      rankText: '2nd Place',
    },
    3: {
      borderColor: 'border-orange-500',
      textColor: 'text-orange-500',
      bgColor: 'bg-orange-600/10',
      shadowClass: 'hover:shadow-2xl hover:shadow-orange-500/30 focus-visible:shadow-orange-500/30',
      order: 'md:order-3',
      lift: '',
      rankText: '3rd Place',
    },
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-16">
        <Award className="mx-auto h-16 w-16 text-amber-400 drop-shadow-lg" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline mt-4">Monthly Hall of Fame</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          The community&apos;s favorite platinum screenshots of {monthYear.toLowerCase()}.
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.08em] text-muted-foreground">
          {daysLeft === 0 ? (
            <span>Final day of voting</span>
          ) : (
            <>The polls close in <span className="tabular font-semibold text-foreground">{daysLeft}</span> {daysLeft === 1 ? 'day' : 'days'}</>
          )}
        </p>
      </div>

      {rankedPlatinums.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border p-12 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-headline text-xl font-bold">The podium is empty this month.</h2>
          <p className="mt-2 text-muted-foreground">Vote on the freshest platinums or upload your own — the first champion of {monthYear} is undecided.</p>
        </div>
      ) : (
        <>
      {/* Podium Section */}
      {podiumPlatinums.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-end max-w-5xl mx-auto mb-20 pt-16">
          {podiumPlatinums.map((platinum, index) => {
            const rank = (index + 1) as 1 | 2 | 3;
            const user = getUserById(platinum.userId);
            const styles = podiumStyles[rank];

            return (
              <div key={platinum.id} className={cn('flex flex-col items-center transform transition-transform', styles.order, styles.lift)}>
                <h2 className={cn('text-2xl font-bold mb-2 font-headline', styles.textColor)}>{styles.rankText}</h2>
                <Link href={`/platinum/${platinum.id}`} className="w-full">
                  <Card className={cn(
                    "overflow-hidden text-center transition-all duration-300 hover:scale-[1.02] focus-visible:scale-[1.02] border",
                    styles.borderColor,
                    styles.bgColor,
                    styles.shadowClass
                  )}>
                    <div className="relative bg-muted" style={{ aspectRatio: `${platinum.width} / ${platinum.height}`, maxHeight: 280, margin: '0 auto' }}>
                      <Image
                        src={platinum.imageUrl}
                        alt={`Screenshot for ${platinum.gameName}`}
                        fill
                        className="object-cover"
                        data-ai-hint={platinum.imageHint}
                        unoptimized={isStoredImage(platinum.imageUrl)}
                      />
                    </div>
                    <CardContent className="p-4">
                      {user && (
                        <div className="flex items-center justify-center gap-2">
                          <Avatar className="h-8 w-8 border-2" style={{borderColor: rank === 1 ? 'var(--platinum-dim)' : undefined}}>
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold truncate">{user.username}</span>
                        </div>
                      )}
                      <h3 className="font-medium mt-2 truncate text-lg">{platinum.gameName}</h3>
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
          <h2 className="text-3xl font-bold text-center mb-8 font-headline relative section-divider">
            <span className="bg-background px-4 relative">Rest of the Top 10</span>
          </h2>
          <ul className="space-y-4">
            {otherRankedPlatinums.map((platinum, index) => {
              const user = getUserById(platinum.userId);
              const rank = index + 4;
              
              return (
                <li key={platinum.id}>
                  <Link href={`/platinum/${platinum.id}`} className="block">
                    <Card className="p-3 sm:p-4 rounded-lg flex items-center gap-4 transition-all duration-300 hover:bg-card/90 hover:shadow-spot focus-visible:shadow-spot outline-hidden">
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
                      <div className="hidden sm:flex flex-col items-end text-right shrink-0">
                        <div className="flex items-center gap-2 text-lg font-bold text-primary tabular">
                          <span>{platinum.monthlyVotes}</span>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground">Monthly Votes</span>
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
