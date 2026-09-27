import { Heart, ImageUp, Share2, Trophy, UserPlus, type LucideIcon } from 'lucide-react';

const SectionDivider = ({ title }: { title: string }) => (
  <div className="relative text-center my-12">
    <div className="absolute inset-0 flex items-center" aria-hidden="true">
      <div className="w-full border-t border-border"></div>
    </div>
    <div className="relative flex justify-center">
      <span className="panel-solid rounded-full px-5 font-headline text-xl font-bold tracking-tight md:text-2xl">{title}</span>
    </div>
  </div>
)

const howItWorksSteps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: UserPlus,
    title: 'Create an account',
    description: 'Sign up to join the community of trophy hunters.'
  },
  {
    icon: ImageUp,
    title: 'Upload your platinum',
    description: 'Post the screenshot your console took the moment the platinum unlocked.'
  },
  {
    icon: Share2,
    title: 'Show it off',
    description: 'Every plate travels with the site mark and a link you can share anywhere.'
  },
  {
    icon: Heart,
    title: 'Vote and compete',
    description: 'One vote each per plate. Help the best screenshots climb the monthly board.'
  },
  {
    icon: Trophy,
    title: 'Enjoy',
    description: 'Celebrate platinum culture with hunters who care about the craft.'
  }
];

export function HowItWorks() {
  return (
    <section className="mt-16">
      <SectionDivider title="How It Works" />
      <ol className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 md:grid-cols-5 mt-8">
        {howItWorksSteps.map((step, index) => (
          <li key={step.title} className="flex flex-col items-center">
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full panel-solid">
              <step.icon className="h-7 w-7 text-foreground" aria-hidden />
              <span className="field-mark absolute -top-1 -right-2 rounded-full panel-solid px-2 py-0.5">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
