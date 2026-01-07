
'use client';

import { getHallOfFame, getTopPlatinums, getLatestPlatinums, getUsers } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { PlatinumCardSkeleton } from '@/components/shared/platinum-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

const SectionDivider = ({ title }: { title: string }) => (
    <div className="relative text-center my-12">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-background px-4 text-lg font-medium text-muted-foreground">{title}</span>
        </div>
    </div>
)

const howItWorksSteps = [
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExazA1cGUzdmY0ZTU0aGZtbGZ2c3JmdXRoM2Y5cWw3cXNrc3M2bGlkNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPb7b1Qp729QJcQ/giphy.gif',
    title: 'Crea una cuenta',
    description: 'Regístrate para unirte a la comunidad de cazadores de trofeos.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3A1dWFqZ2RhaThnZ3Y1ZGQ2YmdicnRsemh1ZzJjMjk2ZGM0cGs3ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKS6a9G23a3g3p6/giphy.gif',
    title: 'Sube tu platino',
    description: 'Sube la captura de pantalla de tu último trofeo de platino de PlayStation.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExajVsYmlzazJ5N2k3ZmNhaWcwdjRzcGZtM25heWxhdzk4bXY2M2w3ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0NwC1pi85J5Ew5oI/giphy.gif',
    title: 'Compártelo',
    description: 'Muestra tu logro y habilidad con tus amigos en las redes sociales.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2Rtc2djaXd0a2Q2MXJzMWR6bWRuN3h1bWR2NWp2bHVxOXZoZ2N1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/S9oGIGurgrL8Y/giphy.gif',
    title: 'Vota y compite',
    description: 'Vota por las capturas de otros para ayudarles a subir en el ranking.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTZxNjd6eXFqNWJhdXRtYnFqNTJzY2ZxcWxtMjJscW1jMmxzdnZpZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2zVf1kS3z4f72/giphy.gif',
    title: 'Disfruta',
    description: 'Disfruta de la comunidad y celebra la cultura del trofeo de platino.'
  }
];

export default function Home() {
  const [hallOfFame, setHallOfFame] = useState<Platinum | null>(null);
  const [topPlatinums, setTopPlatinums] = useState<Platinum[]>([]);
  const [latestPlatinums, setLatestPlatinums] = useState<Platinum[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthYear, setCurrentMonthYear] = useState('');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [hallOfFameData, topPlatinumsData, latestPlatinumsData, usersData] = await Promise.all([
        getHallOfFame(1),
        getTopPlatinums(5),
        getLatestPlatinums(8),
        getUsers()
      ]);
      setHallOfFame(hallOfFameData[0] || null);
      setTopPlatinums(topPlatinumsData);
      setLatestPlatinums(latestPlatinumsData);
      setUsers(usersData);
      setIsLoading(false);
    }
    fetchData();

    // Set date string on client to avoid hydration mismatch
    setCurrentMonthYear(new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }));
  }, []);

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  }
  
  const hallOfFameUser = hallOfFame ? getUserById(hallOfFame.userId) : null;
  
  return (
    <div className="container py-8 md:py-12">
      {/* Hall of Fame */}
      <section className="mb-12">
          <SectionDivider title={`Hall of Fame • ${currentMonthYear}`} />
          {isLoading ? (
            <Skeleton className="relative aspect-[2.39/1] w-full rounded-2xl mt-8" />
          ) : (
            hallOfFame && hallOfFameUser && (
              <div className="relative aspect-[2.39/1] w-full rounded-2xl overflow-hidden mt-8 shadow-2xl shadow-primary/20">
                  <Image 
                      src={hallOfFame.imageUrl}
                      alt={`Platinum screenshot for ${hallOfFame.gameName}`}
                      fill
                      className="object-cover"
                      data-ai-hint={hallOfFame.imageHint}
                      unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8 text-white">
                      <h2 className="text-4xl font-bold font-headline">{hallOfFame.gameName}</h2>
                      <div className="flex items-center gap-2 mt-2 text-lg">
                          <UserIcon className="w-5 h-5" />
                          <span>{hallOfFameUser.username}</span>
                      </div>
                  </div>
              </div>
            )
          )}
      </section>

      {/* Top Platinos */}
      <section className="mb-12">
        <SectionDivider title={`Top Platinos • ${currentMonthYear}`} />
        <div className="mt-8">
          <Carousel opts={{ align: "start", loop: isLoading ? false : topPlatinums.length > 2 }}>
            <CarouselContent className="-ml-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <PlatinumCardSkeleton variant="top" />
                  </CarouselItem>
                ))
              ) : (
                topPlatinums.map(platinum => (
                  <CarouselItem key={platinum.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <PlatinumCard platinum={platinum} user={getUserById(platinum.userId)} variant="top" />
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden lg:flex" />
            <CarouselNext className="hidden lg:flex" />
          </Carousel>
        </div>
      </section>

      {/* Latest Platinos */}
      <section>
        <SectionDivider title="Latest Platinos" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 mt-8">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <PlatinumCardSkeleton key={index} />
              ))
            ) : (
              latestPlatinums.map(platinum => (
                <PlatinumCard key={platinum.id} platinum={platinum} user={getUserById(platinum.userId)} />
              ))
            )}
        </div>
      </section>

      {/* How it Works */}
      <section className="mt-16">
        <SectionDivider title="How It Works" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 text-center mt-8">
          {howItWorksSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 text-primary mb-4 overflow-hidden">
                <Image src={step.gif} alt={step.title} width={96} height={96} unoptimized className="object-cover w-full h-full" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 text-center">
        <div className="relative w-full h-48 flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-t from-background via-card to-background">
            <div 
                className="absolute inset-0 bg-repeat"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%231a2332\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    backgroundSize: '40px 40px',
                    opacity: 0.1
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            <div className="relative z-10">
                <h2 className="text-3xl font-bold text-foreground">Show your platinum to the world</h2>
                <Button asChild size="lg" className="mt-4">
                    <Link href="/upload">Create Your Showcase</Link>
                </Button>
            </div>
        </div>
      </section>
    </div>
  );

    