
import { getPlatinumById, getUserById } from '@/lib/data';
import { auth } from '@/auth';
import { DeletePlatinumButton } from '@/components/shared/delete-platinum-button';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Heart, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlatinumDetailCard } from './platinum-detail-card';
import type { User } from '@/lib/data';
import { SocialShare } from './SocialShare';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const platinum = await getPlatinumById(id);
  
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


export default async function PlatinumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;
  const platinum = await getPlatinumById(id, currentUserId);
  
  if (!platinum) {
    notFound();
  }

  const user: User | undefined = await getUserById(platinum.userId);

  const canDelete = currentUserId === platinum.userId;

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 min-w-0">
            <PlatinumDetailCard platinum={platinum} user={user ?? null} />
        </div>
        <div className="md:col-span-1 min-w-0">
            <div className="bg-card p-6 rounded-lg overflow-hidden">
                <h2 className="text-2xl font-bold font-headline mb-4 break-words">{platinum.gameName}</h2>
                {user && (
                  <div className="mb-6 flex min-w-0 items-center gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={user.avatarUrl} alt={user.username} />
                      <AvatarFallback>{user.username.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.username}</p>
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
                
                <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg">
                    <div className="flex min-w-0 items-center">
                        <Heart className="mr-2 shrink-0 fill-red-500 text-red-500"/>
                        <span className="font-bold tabular">{platinum.votes}</span>
                        <span className="text-muted-foreground ml-1">votes</span>
                    </div>
                     <div className="flex min-w-0 items-center">
                        <Trophy className="mr-2 shrink-0 text-muted-foreground"/>
                        <span className="font-bold tabular">{platinum.monthlyVotes}</span>
                        <span className="text-muted-foreground ml-1">this month</span>
                    </div>
                </div>
                
                <SocialShare platinum={platinum} user={user ?? null} />

                {canDelete && (
                  <DeletePlatinumButton
                    platinumId={platinum.id}
                    redirectTo="/"
                    showLabel
                    className="mt-4 w-full border border-destructive/40 hover:bg-destructive/10"
                  />
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
