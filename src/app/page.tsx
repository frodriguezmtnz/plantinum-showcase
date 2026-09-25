
import { getHallOfFame, getTopPlatinums, getLatestPlatinums, getUsers } from '@/lib/data';
import { auth } from '@/auth';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, Heart, Upload, User as UserIcon } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { isStoredImage } from '@/lib/utils';

const SectionDivider = ({ title }: { title: string }) => (
    <div className="relative text-center my-12">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-background px-4 text-lg font-medium text-muted-foreground" suppressHydrationWarning>{title}</span>
        </div>
    </div>
)

function daysUntilMonthEnd(now: Date): number {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export default async function Home() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const [hallOfFameData, topPlatinumsData, latestPlatinumsData, users] = await Promise.all([
    getHallOfFame(1, currentUserId),
    getTopPlatinums(5, currentUserId),
    getLatestPlatinums(12, currentUserId),
    getUsers()
  ]);
  const hallOfFame = hallOfFameData[0] || null;
  const topPlatinums = topPlatinumsData;
  const latestPlatinums = latestPlatinumsData;
  const featured = latestPlatinums[0] ?? null;
  const now = new Date();
  const currentMonthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  }

  const hallOfFameUser = hallOfFame ? getUserById(hallOfFame.userId) : null;
  const featuredUser = featured ? getUserById(featured.userId) : null;

  return (
    <div>
      {/* Hero: the exhibit under the spotlight */}
      <section className="stage-light relative overflow-hidden">
        <div className="container grid gap-12 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div className="max-w-xl">
            <h1 className="font-headline text-4xl font-black leading-[1.05] tracking-tight text-balance md:text-6xl">
              Show your platinum to the world.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-pretty">
              The community gallery for PlayStation platinum trophies. Post the screenshot,
              earn votes from fellow hunters, and take this month&apos;s crown.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload a platinum
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/explore">Explore the gallery</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /> One vote, one crown, every month</span>
              <span className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Built by hunters, for hunters</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
            {featured ? (
              <Link href={`/platinum/${featured.id}`} className="group block">
                <div
                  className="overflow-hidden rounded-xl bg-card shadow-spot transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1"
                  style={{ aspectRatio: `${featured.width} / ${featured.height}` }}
                >
                  <Image
                    src={featured.imageUrl}
                    alt={`Latest platinum screenshot: ${featured.gameName}`}
                    width={featured.width}
                    height={featured.height}
                    priority
                    className="h-full w-full object-cover"
                    data-ai-hint={featured.imageHint}
                    unoptimized={isStoredImage(featured.imageUrl)}
                  />
                </div>
                <div className="absolute -bottom-5 left-1/2 w-max max-w-[92%] -translate-x-1/2 rounded-lg platinum-plate platinum-edge px-5 py-3 text-center shadow-lg">
                  <p className="truncate font-headline text-base font-bold">{featured.gameName}</p>
                  <p className="text-xs text-muted-foreground">
                    {featuredUser ? `@${featuredUser.username}` : 'fresh from the case'} · {featured.platform}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <div>
                  <p className="font-headline text-lg font-bold">The first exhibit is waiting.</p>
                  <p className="mt-1 text-sm text-muted-foreground">No platinum screenshots yet. Yours could open the show.</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/upload">Upload a platinum</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Champion of the month */}
      <div className="container">
        <section className="pt-16 md:pt-20">
          <SectionDivider title={`Hall of Fame · ${currentMonthYear}`} />
          {hallOfFame && hallOfFameUser ? (
            <div className="relative mx-auto mt-8 max-w-5xl">
              <div className="overflow-hidden rounded-2xl platinum-edge platinum-plate shadow-champion">
                <div className="grid gap-0 md:grid-cols-5">
                  <Link href={`/platinum/${hallOfFame.id}`} className="group relative block overflow-hidden bg-muted md:col-span-3">
                    <div className="aspect-[2.39/1] h-full w-full">
                      <Image
                        src={hallOfFame.imageUrl}
                        alt={`Champion platinum screenshot for ${hallOfFame.gameName}`}
                        fill
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        data-ai-hint={hallOfFame.imageHint}
                        unoptimized={isStoredImage(hallOfFame.imageUrl)}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </Link>
                  <div className="relative flex flex-col justify-center gap-3 p-8 md:col-span-2">
                    <Crown className="h-8 w-8 text-platinum-bright" />
                    <h2 className="font-headline text-3xl font-black leading-tight platinum-text">{hallOfFame.gameName}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserIcon className="h-4 w-4" />
                      <span className="text-sm">{hallOfFameUser.username}</span>
                      <Badge variant="outline">{hallOfFame.platform}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Leading this month with{' '}
                      <span className="tabular font-semibold text-foreground">{hallOfFame.monthlyVotes} votes</span>
                      {' '}· the polls close in {daysUntilMonthEnd(now)} {daysUntilMonthEnd(now) === 1 ? 'day' : 'days'}.
                    </p>
                    <Button asChild variant="outline" className="mt-1 w-fit">
                      <Link href="/hall-of-fame">View the podium</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-dashed border-border p-10 text-center">
              <Crown className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-headline text-xl font-bold">This month&apos;s race hasn&apos;t started.</h2>
              <p className="mt-2 text-muted-foreground">
                The first votes of {currentMonthYear} will crown its champion. Post a screenshot and give the community someone to vote for.
              </p>
              <Button asChild className="mt-5">
                <Link href="/upload">Upload a platinum</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Top Platinums */}
        {topPlatinums.length > 0 && (
        <section className="mb-12">
          <SectionDivider title={`Top Platinums · ${currentMonthYear}`} />
          <div className="mt-8">
            <Carousel opts={{ align: "start", loop: topPlatinums.length > 2 }}>
              <CarouselContent className="-ml-4">
                  {topPlatinums.map(platinum => (
                    <CarouselItem key={platinum.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <PlatinumCard platinum={platinum} user={getUserById(platinum.userId)} variant="top" />
                    </CarouselItem>
                  ))}
              </CarouselContent>
              <CarouselPrevious className="hidden lg:flex" />
              <CarouselNext className="hidden lg:flex" />
            </Carousel>
          </div>
        </section>
        )}

        {/* Latest Platinums */}
        {latestPlatinums.length > 0 && (
        <section>
          <SectionDivider title="Latest Platinums" />
          <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
            {latestPlatinums.map((platinum, index) => (
              <div key={platinum.id} className="mb-6 break-inside-avoid">
                <PlatinumCard platinum={platinum} user={getUserById(platinum.userId)} index={index} />
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <Button asChild variant="ghost">
              <Link href="/explore">See everything in the gallery →</Link>
            </Button>
          </div>
        </section>
        )}
      </div>

      {/* CTA */}
      <section className="container mt-20 pb-4 text-center">
        <div className="stage-light relative w-full rounded-2xl border border-border/60">
          <div className="relative z-10 flex flex-col items-center px-6 py-20">
            <h2 className="font-headline text-3xl font-black text-balance md:text-4xl">Your platinum deserves a wall in this gallery.</h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Every screenshot posted is a story told. Add yours, and let the community decide if it belongs on the podium.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/upload">Create Your Showcase</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
