
import { getPlatinumBySlug, getUserById } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlatinumDetailCard } from './platinum-detail-card';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const platinum = await getPlatinumBySlug(params.slug);
  
  if (!platinum) {
    return {
      title: 'Platinum Not Found',
    }
  }
  
  const user = await getUserById(platinum.userId);

  return {
    title: `${platinum.gameName} Platinum by ${user?.username || 'a user'} | Platinum Showcase`,
    description: `Check out the platinum trophy screenshot for ${platinum.gameName}, achieved by ${user?.username}.`,
  };
}


export default async function PlatinumDetailPage({ params }: { params: { slug: string } }) {
  const platinum = await getPlatinumBySlug(params.slug);
  
  if (!platinum) {
    notFound();
  }

  const user = await getUserById(platinum.userId);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <PlatinumDetailCard platinum={platinum} />
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

                <Button className="w-full vote-button" size="lg">
                    <Heart className="mr-2" /> Vote
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
