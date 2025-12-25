import { getPlatinumById, getUserById, getUsers } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PlatinumCard } from '@/components/shared/platinum-card';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const platinum = await getPlatinumById(params.id);

  if (!platinum) {
    return {
      title: 'Not Found',
    };
  }

  const user = await getUserById(platinum.userId);

  return {
    title: `${platinum.gameName} Platinum by ${user?.username || 'a user'} | Platinum Showcase`,
    description: `Check out this platinum trophy for ${platinum.gameName}, achieved by ${user?.username || 'a user'}.`,
  };
}

export default async function PlatinumDetailPage({ params }: { params: { id: string } }) {
  const platinum = await getPlatinumById(params.id);
  
  if (!platinum) {
    notFound();
  }

  const user = await getUserById(platinum.userId);
  const users = await getUsers();

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="mb-8">
        <PlatinumCard platinum={platinum} user={user} />
      </div>
      
    </div>
  );
}
