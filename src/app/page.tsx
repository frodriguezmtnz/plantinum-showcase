'use client';

import { getPlatinums, getUsers } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [platinums, setPlatinums] = useState<Platinum[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');

  useEffect(() => {
    async function fetchData() {
      const platinumsData = await getPlatinums();
      const usersData = await getUsers();
      setPlatinums(platinumsData);
      setUsers(usersData);
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
  }, [platinums, platformFilter, sortOrder]);

  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">Your Platinum Trophy Showcase</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          The ultimate place for PlayStation gamers to proudly display their hard-earned platinum trophy screenshots. Vote for the best, and climb the leaderboards!
        </p>
        <div className="mt-6 flex gap-4 justify-center">
            <Button asChild size="lg">
                <Link href="/upload">Upload Your Platinum</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
                <Link href="/hall-of-fame">View Hall of Fame</Link>
            </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center my-8">
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Platform:</label>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="PS5">PlayStation 5</SelectItem>
                <SelectItem value="PS4">PlayStation 4</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="most-voted">Most Voted</SelectItem>
                <SelectItem value="least-voted">Least Voted</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      <Separator className="mb-12" />

      {filteredAndSortedPlatinums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPlatinums.map(platinum => (
            <PlatinumCard key={platinum.id} platinum={platinum} user={getUserById(platinum.userId)} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">No Platinums Found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later!</p>
        </div>
      )}
    </section>
  );
}
