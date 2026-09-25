
import Image from 'next/image';

const SectionDivider = ({ title }: { title: string }) => (
    <div className="relative text-center my-12">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-background px-4 text-lg font-medium text-muted-foreground">{title}</span>
        </div>
    </div>
)

const howItWorksSteps = [
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExazA1cGUzdmY0ZTU0aGZtbGZ2c3JmdXRoM2Y5cWw3cXNrc3M2bGlkNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPb7b1Qp729QJcQ/giphy.gif',
    title: 'Create an account',
    description: 'Sign up to join the community of trophy hunters.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3A1dWFqZ2RhaThnZ3Y1ZGQ2YmdicnRsemh1ZzJjMjk2ZGM0cGs3ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKS6a9G23a3g3p6/giphy.gif',
    title: 'Upload your platinum',
    description: 'Post the screenshot of your latest PlayStation platinum trophy.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExajVsYmlzazJ5N2k3ZmNhaWcwdjRzcGZtM25heWxhdzk4bXY2M2w3ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0NwC1pi85J5Ew5oI/giphy.gif',
    title: 'Show it off',
    description: 'Share your achievement and skill with friends on social media.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2Rtc2djaXd0a2Q2MXJzMWR6bWRuN3h1bWR2NWp2bHVxOXZoZ2N1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/S9oGIGurgrL8Y/giphy.gif',
    title: 'Vote and compete',
    description: 'Vote on other hunters\u2019 screenshots to help them climb the ranking.'
  },
  {
    gif: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTZxNjd6eXFqNWJhdXRtYnFqNTJzY2ZxcWxtMjJscW1jMmxzdnZpZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2zVf1kS3z4f72/giphy.gif',
    title: 'Enjoy',
    description: 'Enjoy the community and celebrate platinum trophy culture.'
  }
];

export function HowItWorks() {
  return (
    <section className="mt-16">
      <SectionDivider title="How It Works" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 text-center mt-8">
        {howItWorksSteps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 text-primary mb-4 overflow-hidden">
              <Image src={step.gif} alt={step.title} width={96} height={96} unoptimized className="object-cover w-full h-full" />
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
