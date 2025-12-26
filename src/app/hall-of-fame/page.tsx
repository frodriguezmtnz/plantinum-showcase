import { getMonthlyRanking, getUsers } from '@/lib/data';
import { Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Hall of Fame | Platinum Showcase',
};

export default async function HallOfFamePage() {
  const rankedPlatinums = await getMonthlyRanking();
  const users = await getUsers();

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <Trophy className="mx-auto h-16 w-16 text-amber-400" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline mt-4">Monthly Hall of Fame</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">The community's favorite platinum screenshots of the month. A new champion is crowned every month!</p>
      </div>
      <div className="max-w-4xl mx-auto">
        <ul className="space-y-4">
          {rankedPlatinums.map((platinum, index) => {
            const user = getUserById(platinum.userId);
            const rank = index + 1;
            
            let rankColor = 'text-primary';
            if (rank === 1) rankColor = 'text-amber-400';
            if (rank === 2) rankColor = 'text-gray-400';
            if (rank === 3) rankColor = 'text-orange-400';

            return (
              <li key={platinum.id}>
                <Link href={`/platinum/${platinum.slug}`} className="block">
                  <Card className="p-3 sm:p-4 rounded-lg flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/20 focus-visible:scale-[1.02] focus-visible:shadow-primary/20 outline-none">
                    <div className={`text-2xl sm:text-3xl font-bold w-12 text-center shrink-0 ${rankColor}`}>#{rank}</div>
                    <Image 
                      src={platinum.imageUrl} 
                      alt={`Screenshot for ${platinum.gameName}`} 
                      width={128} 
                      height={72}
                      className="w-24 sm:w-32 h-14 sm:h-18 object-cover rounded-md" 
                      data-ai-hint={platinum.imageHint} 
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{platinum.gameName}</h3>
                      {user && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{user.username}</span>
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-end text-right shrink-0">
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <span>{platinum.monthlyVotes}</span>
                        <Trophy className="text-amber-400 w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">Monthly Votes</span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
