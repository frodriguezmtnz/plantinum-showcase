import { getUserByUsername, getPlatinumsByUserId, getPlatinumById, getUserById } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound } from 'next/navigation';
import { Award, Trophy } from 'lucide-react';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';
import type { Metadata } from 'next';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUserByUsername(params.username);

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

export default async function UserProfilePage({ params }: { params: { username:string } }) {
  const user = await getUserByUsername(params.username);
  if (!user) {
    notFound();
  }

  const platinums = await getPlatinumsByUserId(user.id);
  const pridePlatinum = user.pridePlatinumId ? await getPlatinumById(user.pridePlatinumId) : null;
  const otherPlatinums = platinums.filter(p => p.id !== user.pridePlatinumId);

  return (
    <div className="container py-8 md:py-12">
      <header className="flex flex-col items-center text-center mb-12">
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
            <Trophy className="w-5 h-5 text-amber-400"/>
            <span>{platinums.reduce((acc, p) => acc + p.votes, 0)} Total Votes</span>
          </div>
        </div>
      </header>

      {pridePlatinum && (
        <section className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-6 text-center flex items-center justify-center gap-3">
            <Award className="w-8 h-8 text-amber-400" />
            Pride of the Collection
          </h2>
          <div className="max-w-2xl mx-auto">
            <PlatinumCard platinum={pridePlatinum} user={user} isPride />
          </div>
        </section>
      )}
      
      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-6 text-center">Trophy Gallery</h2>
        {otherPlatinums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherPlatinums.map(platinum => (
              <PlatinumCard key={platinum.id} platinum={platinum} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">This user hasn't showcased their other platinums yet.</p>
        )}
      </section>
    </div>
  );
}
