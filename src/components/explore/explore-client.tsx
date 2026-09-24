'use client';

import { PlatinumCard } from '@/components/shared/platinum-card';
import { useState, useMemo } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { SearchX } from 'lucide-react';

interface ExploreClientProps {
  platinums: Platinum[];
  users: User[];
}

export function ExploreClient({ platinums, users }: ExploreClientProps) {
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const filteredAndSortedPlatinums = useMemo(() => {
    let filtered = platinums;

    if (platformFilter !== 'all') {
      filtered = filtered.filter((p) => p.platform === platformFilter);
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((p) => p.gameName.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    const sorted = [...filtered];
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
      <Card className="p-4 mb-12">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-sm font-medium sr-only sm:not-sr-only">Juego:</label>
            <Input
              type="text"
              placeholder="Buscar por juego..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-sm font-medium sr-only sm:not-sr-only">Plataforma:</label>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="PS5">PlayStation 5</SelectItem>
                <SelectItem value="PS4">PlayStation 4</SelectItem>
                <SelectItem value="PS3">PlayStation 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-sm font-medium sr-only sm:not-sr-only">Ordenar por:</label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full">
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
      </Card>

      {filteredAndSortedPlatinums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedPlatinums.map((platinum, index) => (
            <PlatinumCard key={platinum.id} platinum={platinum} user={getUserById(platinum.userId)} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No se encontraron platinos"
          description="Prueba a ajustar los filtros o vuelve más tarde."
          actionLabel="Subir platino"
          actionHref="/upload"
        />
      )}
    </section>
  );
}