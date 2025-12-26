
'use client';

import { getPlatinumById, getUserById } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { PlatinumCard } from '@/components/shared/platinum-card';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';

// This is now a client component, so we can't use generateMetadata directly.
// We can set the title dynamically in the component.

export default function PlatinumDetailPage({ params }: { params: { id: string } }) {
  const [platinum, setPlatinum] = useState<Platinum | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { user: authUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const platinumData = await getPlatinumById(params.id);
      if (platinumData) {
        const userData = await getUserById(platinumData.userId);
        setPlatinum(platinumData);
        setUser(userData || null);

        // Dynamic metadata update
        document.title = `${platinumData.gameName} Platinum by ${userData?.username || 'a user'} | Platinum Showcase`;
      } else {
        notFound();
      }
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  const handleVoteClick = () => {
    if (!authUser) {
      router.push('/login');
    } else {
      // TODO: Implement vote logic
      console.log('Voted!');
    }
  };

  if (loading) {
    return <div className="container text-center py-12">Loading...</div>;
  }
  
  if (!platinum) {
    return notFound();
  }

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <PlatinumCard platinum={platinum} user={user || undefined} />
        </div>
        <div className="md:col-span-1">
            <div className="bg-card p-6 rounded-lg">
                <h2 className="text-2xl font-bold font-headline mb-4">{platinum.gameName}</h2>
                {user && (
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl} alt={user.username} />
                      <AvatarFallback>{user.username.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <Link href={`/u/${user.username}`} className="text-sm text-primary hover:underline">
                        View Profile
                      </Link>
                    </div>
                  </div>
                )}
                <div className="space-y-3 text-sm mb-6">
                    <p><strong>Platform:</strong> {platinum.platform}</p>
                    <p><strong>Achieved on:</strong> {format(new Date(platinum.platinumDate), 'MMMM d, yyyy')}</p>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center text-lg">
                        <Heart className="mr-2 text-primary"/>
                        <span className="font-bold">{platinum.votes}</span>
                        <span className="text-muted-foreground ml-1">votes</span>
                    </div>
                     <div className="flex items-center text-lg">
                        <Heart className="mr-2 text-amber-400"/>
                        <span className="font-bold">{platinum.monthlyVotes}</span>
                        <span className="text-muted-foreground ml-1">this month</span>
                    </div>
                </div>

                <Button className="w-full vote-button" size="lg" onClick={handleVoteClick}>
                    <Heart className="mr-2" /> Vote
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
