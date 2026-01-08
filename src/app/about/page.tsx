import { type Metadata } from 'next';
import { HowItWorks } from '@/components/shared/how-it-works';

export const metadata: Metadata = {
  title: 'About | Platinum Showcase',
  description: 'Learn more about Platinum Showcase, the community for PlayStation trophy hunters.',
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="prose prose-invert mx-auto">
        <h1 className="text-4xl font-bold font-headline mb-8">About Platinum Showcase</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to Platinum Showcase, the ultimate hub for PlayStation enthusiasts to share, celebrate, and discover the most coveted achievement in gaming: the Platinum Trophy.
        </p>
        
        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Our Mission</h2>
        <p>
          We believe that every Platinum Trophy tells a story. It's a tale of dedication, skill, late nights, and the thrill of conquering a virtual world. Our mission is to provide a dedicated space where these stories can be shared and celebrated. We're not just about showing off; we're about appreciating the journey that goes into earning each and every plat.
        </p>
      </div>

      <HowItWorks />
      
      <div className="prose prose-invert mx-auto">
        <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Join the Community</h2>
        <p>
          Whether you're a seasoned trophy hunter with hundreds of platinums or a newcomer who just earned their very first one, you have a place here. Join us in celebrating the art of game completion.
        </p>
        <p>
          Happy hunting!
        </p>
      </div>
    </div>
  );
}
