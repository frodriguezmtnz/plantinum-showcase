import { type Metadata } from 'next';
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

const faqs = [
  {
    question: 'What is a Platinum Trophy?',
    answer:
      "A Platinum Trophy is a special type of trophy awarded by Sony on the PlayStation platform. It is typically awarded for unlocking all other trophies in a game's base list, signifying 100% completion.",
  },
  {
    question: 'How do I upload my platinum screenshot?',
    answer:
      "You need to be a registered user to upload. Once logged in, click the 'Upload' button in the header. You'll be asked to provide the game name, the date you earned the platinum, the screenshot itself, and you can add an optional comment.",
  },
  {
    question: 'What are the rules for screenshots?',
    answer:
      'The screenshot must be the official one automatically taken by your PlayStation console when the platinum trophy unlocks. Please avoid submitting unrelated images. Make sure to mark it as a spoiler if it reveals key plot points!',
  },
  {
    question: 'How does the Hall of Fame work?',
    answer:
      'The Hall of Fame showcases the platinums that have received the most votes from the community within a single calendar month. At the end of each month, the rankings are finalized, and a new competition begins.',
  },
  {
    question: 'Can I change my vote?',
    answer:
      'You can cast one vote per platinum and it is reversible: click the heart again to remove your vote. You cannot vote for your own platinums, so the competition stays fair.',
  },
];

export default function FAQPage() {
  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Frequently Asked Questions</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Have questions? We have answers.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
