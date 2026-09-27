import { type Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Pricing | Platinum Showcase',
  description: 'Platinum Showcase is free and always ad-free. A Supporter tier with cosmetic perks is coming soon.',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'Everything the board offers today.',
    perks: [
      'Unlimited platinum uploads',
      'One vote per plate, every month',
      'Monthly races and the Hall of Fame',
      'A small site watermark on your uploads',
    ],
    cta: { label: 'Start uploading', href: '/upload', disabled: false },
    current: true,
  },
  {
    name: 'Supporter',
    price: 'Coming soon',
    tagline: 'A one-time thank-you for keeping the lights on.',
    perks: [
      'Uploads without the site watermark',
      'Supporter badge on your profile',
      'Your name on the backers wall',
      'Every current feature, unchanged',
    ],
    cta: { label: 'Coming soon', href: '/pricing', disabled: true },
    current: false,
  },
  {
    name: 'Supporter Monthly',
    price: 'Coming soon',
    tagline: 'Ongoing support with room for what comes next.',
    perks: [
      'Everything in the one-time tier',
      'Early access to new features',
      'Vote on what gets built next',
      'Cancel whenever you like',
    ],
    cta: { label: 'Coming soon', href: '/pricing', disabled: true },
    current: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container max-w-5xl py-10 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="field-mark">Pricing</p>
        <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight md:text-5xl">
          Free today, and always ad-free.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          No ads, no pay-to-win, no locked boards. A Supporter tier is on the way for hunters who want to keep
          it that way.
        </p>
      </header>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`${plan.current ? 'panel-solid' : 'panel'} flex flex-col rounded-2xl p-6 md:p-8`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="field-mark whitespace-nowrap">{plan.name}</p>
              {!plan.current && (
                <span className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Coming soon
                </span>
              )}
            </div>

            <p className="mt-5 font-headline text-3xl font-bold tracking-tight md:text-4xl">{plan.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>

            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            {plan.cta.disabled ? (
              <Button className="mt-8 w-full" disabled>
                {plan.cta.label}
              </Button>
            ) : (
              <Button className="mt-8 w-full" asChild>
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>
            )}
          </div>
        ))}
      </div>

      <section className="panel mt-8 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Sparkles className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
          <div>
            <h2 className="font-headline text-xl font-bold tracking-tight">What Supporters will never get</h2>
            <p className="mt-2 text-muted-foreground">
              Extra votes, secret rankings or a shortcut onto the board. Supporter perks stay cosmetic — the race
              is the same for everyone, and it always will be. Until Stripe is wired up, nothing on this page can
              be bought.
            </p>
          </div>
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Questions about how the board works? Read the{' '}
        <Link href="/faq" className="text-primary underline underline-offset-4">
          FAQ
        </Link>
        .
      </p>
    </div>
  );
}
