import { getPlatinums, getUsers } from '@/lib/data';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Home() {
  const platinums = await getPlatinums();
  const users = await getUsers();

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  }

  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-12">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {platinums.map(platinum => (
          <PlatinumCard key={platinum.id} platinum={platinum} user={getUserById(platinum.userId)} />
        ))}
      </div>
    </section>
  );
}
