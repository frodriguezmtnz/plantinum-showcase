'use client';

import { useEffect, useRef, useState } from 'react';
import { checkUsernameAvailability } from '@/app/register/actions';
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@/lib/usernames';

export type UsernameStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'invalid' | 'reserved' | 'taken' | 'rate-limited' };

/**
 * Shared live probe for the register and OAuth onboarding forms. Shape checks
 * are derived synchronously; only the database lookup is debounced, and stale
 * responses from older keystrokes are discarded.
 */
export function useUsernameAvailability(username: string): UsernameStatus {
  const [checkResult, setCheckResult] = useState<{
    forUsername: string;
    status: UsernameStatus;
  } | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const value = username.trim();
    if (
      value.length < USERNAME_MIN_LENGTH ||
      value.length > USERNAME_MAX_LENGTH ||
      !USERNAME_PATTERN.test(value)
    ) {
      return;
    }

    const id = (requestId.current += 1);
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(value);
        if (requestId.current !== id) return; // a newer keystroke already won
        setCheckResult({
          forUsername: value,
          status: result.available
            ? { state: 'available' }
            : { state: result.reason ?? 'taken' },
        });
      } catch {
        if (requestId.current === id) setCheckResult(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const trimmed = username.trim();
  if (trimmed.length === 0) return { state: 'idle' };

  const shapeValid =
    trimmed.length >= USERNAME_MIN_LENGTH &&
    trimmed.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(trimmed);
  if (!shapeValid) return { state: 'invalid' };

  return checkResult && checkResult.forUsername === trimmed
    ? checkResult.status
    : { state: 'checking' };
}
