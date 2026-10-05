import { type Metadata } from 'next';
import Link from 'next/link';
import { Check, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/plans';

function uploadsPerMonth(limit: number): string {
  return Number.isFinite(limit)
    ? `${limit} upload${limit === 1 ? '' : 's'} per month`
    : 'Unlimited uploads (fair use)';
}

const WATERMARK_PERK = 'A small site watermark on your uploads';
const NO_WATERMARK_PERK = 'No watermark on your uploads';

export const metadata: Metadata = {
  title: 'Pricing | Platinum Showcase',
  description: `Voting and the Hall of Fame are free forever. Upload tiers keep the lights on: Free ${PLANS.FREE.monthlyUploadLimit}/month, PRO ${PLANS.PRO.monthlyUploadLimit}/month with no watermark, PLATINUM unlimited with supporter flair.`,
};

const plans = [
  {
    name: 'Free',
    price: '0€',
    tagline: 'Everything the board offers today.',
    perks: [
      uploadsPerMonth(PLANS.FREE.monthlyUploadLimit),
      'Vote on as many plates as you like',
      'Monthly races and the Hall of Fame',
      PLANS.FREE.watermark ? WATERMARK_PERK : NO_WATERMARK_PERK,
    ],
    cta: { label: 'Start uploading', href: '/upload', disabled: false },
    current: true,
  },
  {
    name: 'PRO',
    price: '7€',
    priceNote: '/month',
    tagline: 'For hunters with more than a monthly highlight.',
    perks: [
      uploadsPerMonth(PLANS.PRO.monthlyUploadLimit),
      PLANS.PRO.watermark ? WATERMARK_PERK : NO_WATERMARK_PERK,
      'Everything in Free, unchanged',
    ],
    cta: { label: 'Coming soon', href: '/pricing', disabled: true },
    current: false,
  },
  {
    name: 'PLATINUM',
    price: 'Coming soon',
    tagline: 'For the ones who wear the board.',
    perks: [
      uploadsPerMonth(PLANS.PLATINUM.monthlyUploadLimit),
      PLANS.PLATINUM.watermark ? WATERMARK_PERK : 'No watermark',
      'A platinum supporter mark on your avatar',
      'A supporter chip on your plates',
      'Everything in PRO',
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
          Free to vote. Fair to keep.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Voting, the monthly board and the Hall of Fame are free forever — no ads, no pay-to-win. Uploads come
          in monthly tiers so hosting stays sustainable.
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

            <p className="mt-5 font-headline text-3xl font-bold tracking-tight md:text-4xl">
              {plan.price}
              {'priceNote' in plan && plan.priceNote ? (
                <span className="text-lg font-semibold text-muted-foreground">{plan.priceNote}</span>
              ) : null}
            </p>
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
              Extra votes, secret rankings or a shortcut onto the board. Paid tiers raise your upload cap and
              strip the watermark — the race itself stays the same for everyone, and it always will be. Until
              Stripe is wired up, nothing on this page can be bought.
            </p>
          </div>
        </div>
      </section>

      <section className="panel mt-8 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Heart className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <h2 className="font-headline text-xl font-bold tracking-tight">Just passing through?</h2>
              <p className="mt-2 text-muted-foreground">
                A one-time tip jar (Ko-fi / PayPal) is on the way. Tips unlock nothing — they just keep the
                servers humming.
              </p>
            </div>
          </div>
          <Button disabled variant="outline">
            Tip jar — coming soon
          </Button>
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
