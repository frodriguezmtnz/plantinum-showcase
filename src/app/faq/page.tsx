import { type Metadata } from 'next';
import Link from 'next/link';
import { type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'FAQ | Platinum Showcase',
  description: 'Frequently Asked Questions about Platinum Showcase.',
};

interface Faq {
  question: string;
  answer: ReactNode;
}

const faqGroups: { title: string; faqs: Faq[] }[] = [
  {
    title: 'The basics',
    faqs: [
      {
        question: 'What is a Platinum Trophy?',
        answer:
          "A Platinum Trophy is a special type of trophy awarded by Sony on the PlayStation platform. It is typically awarded for unlocking all other trophies in a game's base list, signifying 100% completion.",
      },
      {
        question: 'Is Platinum Showcase free?',
        answer: (
          <>
            Yes — voting, the monthly board and the Hall of Fame are free forever, and there are no ads
            anywhere. Uploads come as a monthly allowance (3 on the Free tier); PRO and PLATINUM raise the cap
            and drop the watermark — see{' '}
            <Link href="/pricing" className="text-primary underline underline-offset-4">
              Pricing
            </Link>
            .
          </>
        ),
      },
      {
        question: 'Do I need an account to take part?',
        answer:
          'You can browse the gallery and the Hall of Fame without signing in. Uploading and voting need an account — it is what keeps one vote per hunter honest.',
      },
    ],
  },
  {
    title: 'Uploading',
    faqs: [
      {
        question: 'How do I upload my platinum screenshot?',
        answer:
          "Once logged in, click the 'Upload' button in the header. You'll be asked for the game name, the date you earned the platinum, the screenshot itself, and an optional comment.",
      },
      {
        question: 'What are the rules for screenshots?',
        answer:
          'The screenshot must be the official one automatically taken by your PlayStation console when the platinum trophy unlocks. Avoid unrelated images, and mark it as a spoiler if it reveals key plot points.',
      },
      {
        question: 'Which formats and sizes can I upload?',
        answer:
          'JPG, PNG or WEBP up to 6 MB. Your browser compresses the file before sending it, and the server re-encodes it to AVIF (max 1600px on the long edge) so the gallery stays fast.',
      },
      {
        question: 'What is the watermark on my screenshot?',
        answer: (
          <>
            Free uploads carry a small Platinum Showcase mark baked into the corner, so a screenshot keeps
            pointing back here wherever it is shared. PRO and PLATINUM uploads skip it — see{' '}
            <Link href="/pricing" className="text-primary underline underline-offset-4">
              Pricing
            </Link>
            .
          </>
        ),
      },
      {
        question: 'Is there a limit to how many platinums I can upload?',
        answer: (
          <>
            Uploads come as a monthly allowance: 3 per month on Free, 10 on PRO, and unlimited on PLATINUM
            (fair use). The Free and PRO allowances reset at the start of each calendar month (Europe/Madrid).
            Separately, the same screenshot cannot be uploaded twice from the same account — duplicates are
            rejected automatically. See{' '}
            <Link href="/pricing" className="text-primary underline underline-offset-4">
              Pricing
            </Link>
            .
          </>
        ),
      },
      {
        question: 'What happens when I hit my monthly limit?',
        answer: (
          <>
            Uploads pause until the allowance resets at the start of the next month (Europe/Madrid time) —
            plates already on the board are untouched. If you would rather not wait, the higher tiers raise or
            remove the cap; see{' '}
            <Link href="/pricing" className="text-primary underline underline-offset-4">
              Pricing
            </Link>
            .
          </>
        ),
      },
      {
        question: 'What is a spoiler plate?',
        answer:
          'If a screenshot reveals a key story moment, mark it as a spoiler when uploading. The plate stays frosted on the board until a visitor chooses to reveal it.',
      },
    ],
  },
  {
    title: 'Voting and the board',
    faqs: [
      {
        question: 'How does the Hall of Fame work?',
        answer:
          'The Hall of Fame showcases the platinums that received the most votes from the community within a single calendar month (Europe/Madrid time). When the month ends, that race is closed and a fresh one begins.',
      },
      {
        question: 'Can I change my vote?',
        answer:
          'You can cast one vote per platinum and it is reversible: click the heart again to remove it. You cannot vote for your own platinums, so the competition stays fair.',
      },
      {
        question: 'What happens to votes when the month resets?',
        answer:
          'Monthly votes go back to zero for everyone, so each month is a clean race. Each plate keeps its all-time vote total, which never resets.',
      },
    ],
  },
  {
    title: 'Your content',
    faqs: [
      {
        question: 'Can I delete a platinum I uploaded?',
        answer:
          'Yes. Open the platinum and use the delete button (also available from your profile). The stored image is removed along with it, and deleting a plate also frees its slot in that month\'s upload allowance.',
      },
      {
        question: 'Can I edit a platinum after uploading it?',
        answer:
          'Not yet — editing is on the roadmap. For now you can delete the plate and upload it again with the corrected details.',
      },
      {
        question: 'Who can see the comment I write?',
        answer:
          'Today the comment is visible only to you on your own profile while we finish the moderation flow. Comments will become public once moderation is in place.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <header className="text-center mb-12">
        <p className="field-mark">Support</p>
        <h1 className="mt-4 text-4xl font-bold font-headline tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Have questions? We have answers.
        </p>
      </header>

      <div className="space-y-12">
        {faqGroups.map((group) => (
          <section key={group.title}>
            <h2 className="field-mark mb-3">{group.title}</h2>
            <Accordion type="single" collapsible className="w-full">
              {group.faqs.map((faq) => (
                <AccordionItem value={`${group.title}-${faq.question}`} key={faq.question}>
                  <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Still stuck? Open an issue on{' '}
        <a
          href="https://github.com/frodriguezmtnz/plantinum-showcase"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  );
}
