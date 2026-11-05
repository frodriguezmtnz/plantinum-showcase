import type { ReactNode } from 'react';

interface AuthUtilityAsideProps {
  illustration: ReactNode;
  title: string;
  description: string;
  points: string[];
}

/** Left panel for verify/reset flows: a drawing plus flow-specific microcopy. */
export function AuthUtilityAside({
  illustration,
  title,
  description,
  points,
}: AuthUtilityAsideProps) {
  return (
    <div className="space-y-8">
      {illustration}
      <div className="space-y-4">
        <h2 className="font-headline text-4xl font-bold leading-tight">
          {title}
        </h2>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>
      <ul className="space-y-3 text-sm">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span
              className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
