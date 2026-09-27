import { type Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, EyeOff, Heart, ShieldCheck } from 'lucide-react';
import { HowItWorks } from '@/components/shared/how-it-works';
import { Button } from '@/components/ui/button';
import { getCommunityStats } from '@/lib/data';

export const metadata: Metadata = {
  title: 'About | Platinum Showcase',
  description: 'Learn more about Platinum Showcase, the community for PlayStation trophy hunters.',
};

const rules = [
  {
    icon: Heart,
    title: 'One vote each',
    description: 'Every hunter gets a single, reversible vote per plate. Quality wins, not volume.',
  },
  {
    icon: CalendarClock,
    title: 'The board resets monthly',
    description: 'Rankings run on the calendar month, so a new race starts the moment the clocks roll over.',
  },
  {
    icon: EyeOff,
    title: 'Spoilers stay covered',
    description: 'Mark a plate as a spoiler and the screenshot stays frosted until someone chooses to reveal it.',
  },
  {
    icon: ShieldCheck,
    title: 'No self-votes',
    description: 'You can never vote for your own platinum, so every climb on the board is earned.',
  },
];

export default async function AboutPage() {
  const stats = await getCommunityStats();

  const statCards = [
    { label: 'Platinums on show', value: stats.platinums },
    { label: 'Votes cast', value: stats.votes },
    { label: 'Hunters', value: stats.hunters },
    { label: 'Games featured', value: stats.games },
  ];

  return (
    <div className="container py-10 md:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="field-mark">About the console</p>
        <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight md:text-5xl">
          Every platinum tells a story.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Platinum Showcase is the community gallery for PlayStation&apos;s hardest badge: one screenshot each,
          one vote each, and a fresh board every month.
        </p>
      </header>

      <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="panel rounded-2xl p-5 text-center">
            <p className="tabular font-headline text-3xl font-bold tracking-tight md:text-4xl">
              {stat.value.toLocaleString('en-US')}
            </p>
            <p className="field-mark mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="panel rounded-2xl p-6 md:p-8">
          <h2 className="font-headline text-2xl font-bold tracking-tight">Why we built it</h2>
          <p className="mt-4 text-muted-foreground">
            Every platinum is a story: dedication, skill, late nights, and the quiet thrill of finishing a
            world completely. A trophy list can&apos;t tell that story — the screenshot can. This is the wall
            where those moments hang.
          </p>
        </div>
        <div className="panel rounded-2xl p-6 md:p-8">
          <h2 className="font-headline text-2xl font-bold tracking-tight">What counts here</h2>
          <p className="mt-4 text-muted-foreground">
            Only the official screenshot your console takes when the platinum unlocks. No mock-ups, no
            re-uploads of someone else&apos;s run. Real plates, real hunters, real numbers — we don&apos;t invent
            anything to look bigger than we are.
          </p>
        </div>
      </section>

      <HowItWorks />

      <section className="mt-16">
        <h2 className="text-center font-headline text-2xl font-bold tracking-tight">The rules of the board</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rules.map((rule) => (
            <div key={rule.title} className="panel-solid rounded-2xl p-5">
              <rule.icon className="h-5 w-5 text-foreground" aria-hidden />
              <h3 className="mt-3 font-semibold">{rule.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel mt-16 rounded-2xl p-8 text-center md:p-12">
        <h2 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
          Your platinum deserves an audience.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Hang it on the board, vote for the plates you respect, and see who takes the month.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/upload">Upload your platinum</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/explore">Explore the gallery</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
