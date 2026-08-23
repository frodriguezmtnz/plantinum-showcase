
import { getUserByUsername, getPlatinumsByUserId, getPlatinumById } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound } from 'next/navigation';
import { ThumbsUp, Trophy } from 'lucide-react';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';
import { EmptyState } from '@/components/shared/empty-state';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: 'User Not Found',
    };
  }

  return {
    title: `${user.username}'s Profile | Platinum Showcase`,
    description: `Check out ${user.username}'s collection of PlayStation platinum trophies.`,
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }

  const platinums = await getPlatinumsByUserId(user.id);
  const pridePlatinum = user.pridePlatinumId ? await getPlatinumById(user.pridePlatinumId) : null;
  
  // Exclude pride platinum from the main gallery if it exists
  const otherPlatinums = pridePlatinum 
    ? platinums.filter(p => p.id !== user.pridePlatinumId)
    : platinums;

  return (
    <div className="container py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
          <AvatarImage src={user.avatarUrl} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-bold font-headline">{user.username}</h1>
        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <PlatinumTrophyIcon className="w-5 h-5"/>
            <span>{platinums.length} Platinums</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-primary"/>
            <span>{platinums.reduce((acc, p) => acc + p.votes, 0)} Total Votes</span>
          </div>
        </div>
      </div>

      {pridePlatinum && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-6 text-center font-headline">
            Pride of the Collection
          </h2>
          <div className="max-w-2xl mx-auto">
            <PlatinumCard platinum={pridePlatinum} user={user} isPride />
          </div>
        </section>
      )}
      
      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-6 text-center font-headline">Trophy Gallery</h2>
        {otherPlatinums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {otherPlatinums.map(platinum => (
              <PlatinumCard key={platinum.id} platinum={platinum} user={user} />
            ))}
          </div>
        ) : (
           pridePlatinum ? (
            <EmptyState
              icon={Trophy}
              title="Solo tiene un platino"
              description="Este usuario todavía no ha mostrado sus otros platinos."
            />
           ) : (
            <EmptyState
              icon={Trophy}
              title="Sin platinos aún"
              description="Este usuario no ha mostrado ningún platino todavía."
              actionLabel="Subir platino"
              actionHref="/upload"
            />
           )
        )}
      </section>
    </div>
  );
}
