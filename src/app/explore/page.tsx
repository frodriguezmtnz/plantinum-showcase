
'use client';

import { getPlatinums, getUsers } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { useEffect, useState, useMemo } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PlatinumCardSkeleton } from '@/components/shared/platinum-card-skeleton';

export default function ExplorePage() {
  const [platinums, setPlatinums] = useState<Platinum[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const platinumsData = await getPlatinums();
      const usersData = await getUsers();
      setPlatinums(platinumsData);
      setUsers(usersData);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  }

  const filteredAndSortedPlatinums = useMemo(() => {
    let filtered = platinums;

    if (platformFilter !== 'all') {
      filtered = filtered.filter(p => p.platform === platformFilter);
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(p => p.gameName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    let sorted = [...filtered];
    switch (sortOrder) {
      case 'most-voted':
        sorted.sort((a, b) => b.votes - a.votes);
        break;
      case 'least-voted':
        sorted.sort((a, b) => a.votes - b.votes);
        break;
      case 'recent':
      default:
        sorted.sort((a, b) => new Date(b.platinumDate).getTime() - new Date(a.platinumDate).getTime());
        break;
    }
    return sorted;
  }, [platinums, platformFilter, sortOrder, searchQuery]);

  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">Explorar Galería</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Navega por todas las capturas de platino subidas por la comunidad. Usa los filtros para encontrar exactamente lo que buscas.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center my-8">
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Juego:</label>
            <Input 
              type="text"
              placeholder="Buscar por juego..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px]"
            />
        </div>
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Plataforma:</label>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="PS5">PlayStation 5</SelectItem>
                <SelectItem value="PS4">PlayStation 4</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Ordenar por:</label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recientes</SelectItem>
                <SelectItem value="most-voted">Más votados</SelectItem>
                <SelectItem value="least-voted">Menos votados</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      <Separator className="mb-12" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <PlatinumCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredAndSortedPlatinums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPlatinums.map(platinum => (
            <PlatinumCard key={platinum.id} platinum={platinum} user={getUserById(platinum.userId)} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">No se encontraron platinos</h2>
            <p className="text-muted-foreground mt-2">¡Prueba a ajustar los filtros o vuelve más tarde!</p>
        </div>
      )}
    </section>
  );
}
