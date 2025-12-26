
'use client';

import { getHallOfFame, getTopPlatinums, getLatestPlatinums, getUsers } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import Image from 'next/image';
import { User as UserIcon, UploadCloud, Share2, Vote, PartyPopper, UserPlus } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

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
    icon: UserPlus,
    title: 'Crea una cuenta',
    description: 'Regístrate para unirte a la comunidad de cazadores de trofeos.'
  },
  {
    icon: UploadCloud,
    title: 'Sube tu platino',
    description: 'Sube la captura de pantalla de tu último trofeo de platino de PlayStation.'
  },
  {
    icon: Share2,
    title: 'Compártelo',
    description: 'Muestra tu logro y habilidad con tus amigos en las redes sociales.'
  },
  {
    icon: Vote,
    title: 'Vota y compite',
    description: 'Vota por las capturas de otros para ayudarles a subir en el ranking.'
  },
  {
    icon: PartyPopper,
    title: 'Disfruta',
    description: 'Disfruta de la comunidad y celebra la cultura del trofeo de platino.'
  }
];

export default function Home() {
  const [hallOfFame, setHallOfFame] = useState<Platinum | null>(null);
  const [topPlatinums, setTopPlatinums] = useState<Platinum[]>([]);
  const [latestPlatinums, setLatestPlatinums] = useState<Platinum[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentMonthYear, setCurrentMonthYear] = useState('');

  useEffect(() => {
    async function fetchData() {
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
      {hallOfFame && hallOfFameUser && (
        <section className="mb-12">
            <SectionDivider title={`Hall of Fame • ${currentMonthYear}`} />
            <div className="relative aspect-[2.39/1] w-full rounded-2xl overflow-hidden mt-8 shadow-2xl shadow-primary/20">
                <Image 
                    src={hallOfFame.imageUrl}
                    alt={`Platinum screenshot for ${hallOfFame.gameName}`}
                    fill
                    className="object-cover"
                    data-ai-hint={hallOfFame.imageHint}
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
        </section>
      )}

      {/* Top Platinos */}
      <section className="mb-12">
        <SectionDivider title={`Top Platinos • ${currentMonthYear}`} />
        <div className="mt-8">
          <Carousel opts={{ align: "start", loop: true }}>
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

      {/* Latest Platinos */}
      <section>
        <SectionDivider title="Latest Platinos" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 mt-8">
            {latestPlatinums.map(platinum => (
            <PlatinumCard key={platinum.id} platinum={platinum} user={getUserById(platinum.userId)} />
            ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="mt-16">
        <SectionDivider title="How It Works" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center mt-8">
          {howItWorksSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 text-primary mb-4">
                <step.icon className="w-8 h-8" />
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
}
