'use client';

import { getPlatinums, getUsers, getHallOfFame } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import type { Platinum, User } from '@/lib/data';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const [platinums, setPlatinums] = useState<Platinum[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch top 4 platinums for the hero section
      const platinumsData = await getHallOfFame(4);
      const usersData = await getUsers();
      setPlatinums(platinumsData);
      setUsers(usersData);
    }
    fetchData();
  }, []);

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  }

  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">Tu Vitrina de Trofeos de Platino</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          El lugar definitivo para que los jugadores de PlayStation muestren con orgullo sus capturas de pantalla de trofeos de platino ganados con esfuerzo. ¡Vota por los mejores y sube en las clasificaciones!
        </p>
        <div className="mt-6 flex gap-4 justify-center">
            <Button asChild size="lg">
                <Link href="/upload">Sube tu Platino</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
                <Link href="/hall-of-fame">Ver Salón de la Fama</Link>
            </Button>
        </div>
      </div>
      
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Destacados</h2>
            <Button asChild variant="ghost">
                <Link href="/explore">
                    Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
        {platinums.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {platinums.map(platinum => (
                <PlatinumCard key={platinum.id} platinum={platinum} user={getUserById(platinum.userId)} />
                ))}
            </div>
        ) : (
            <div className="text-center py-16">
                <h2 className="text-2xl font-semibold">No se encontraron platinos</h2>
                <p className="text-muted-foreground mt-2">¡Vuelve más tarde para ver los destacados!</p>
            </div>
        )}
      </div>

    </section>
  );
}
