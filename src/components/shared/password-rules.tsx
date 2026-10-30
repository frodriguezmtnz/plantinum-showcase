'use client';

import { Check, X } from 'lucide-react';
import { PASSWORD_RULES, passwordRuleResults } from '@/lib/password';
import { cn } from '@/lib/utils';

interface PasswordRulesProps {
  value: string;
  confirm?: string;
  current?: string;
  id?: string;
  className?: string;
}

function RuleItem({
  met,
  destructive,
  label,
}: {
  met: boolean;
  destructive?: boolean;
  label: string;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-1.5',
        met
          ? 'text-emerald-600'
          : destructive
            ? 'text-destructive'
            : 'text-muted-foreground',
      )}
    >
      {met ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <X className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </li>
  );
}

/** Live checklist shared by Settings and the register form. */
export function PasswordRules({
  value,
  confirm,
  current,
  id,
  className,
}: PasswordRulesProps) {
  const results = passwordRuleResults(value);
  const match =
    confirm !== undefined ? value.length > 0 && value === confirm : null;
  const different =
    current !== undefined && current.length > 0 ? value !== current : null;

  return (
    <ul
      id={id}
      aria-live="polite"
      className={cn('grid gap-1 text-xs sm:grid-cols-2', className)}
    >
      {PASSWORD_RULES.map((rule) => (
        <RuleItem key={rule.id} met={results[rule.id]} label={rule.label} />
      ))}
      {match !== null && (
        <RuleItem
          met={match}
          destructive={!match && Boolean(confirm)}
          label="Passwords match"
        />
      )}
      {different !== null && (
        <RuleItem
          met={different}
          destructive={!different}
          label="Different from current"
        />
      )}
    </ul>
  );
}
