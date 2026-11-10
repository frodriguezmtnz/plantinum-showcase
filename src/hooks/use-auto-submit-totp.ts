'use client';

import { useEffect, useRef } from 'react';
import { isTotpCode } from '@/lib/two-factor-code';

interface UseAutoSubmitTotpOptions {
  value: string;
  enabled: boolean;
  pending?: boolean;
  onSubmit: () => void;
  delayMs?: number;
}

/**
 * Auto-submit a 6-digit TOTP once the value has been stable for `delayMs`, so a
 * paste can settle before the request fires. Values that are not exactly six
 * digits (e.g. recovery codes) never trigger a submit.
 */
export function useAutoSubmitTotp({
  value,
  enabled,
  pending = false,
  onSubmit,
  delayMs = 300,
}: UseAutoSubmitTotpOptions) {
  const onSubmitRef = useRef(onSubmit);
  const pendingRef = useRef(pending);
  const lastAttemptedRef = useRef<string | null>(null);

  // Keep the latest callback/state in refs so the timer never captures a stale
  // closure and changing props do not re-arm the debounce.
  useEffect(() => {
    onSubmitRef.current = onSubmit;
    pendingRef.current = pending;
  });

  useEffect(() => {
    if (!enabled) {
      lastAttemptedRef.current = null;
      return;
    }

    const normalized = value.replace(/\s/g, '');
    if (!isTotpCode(normalized)) {
      lastAttemptedRef.current = null;
      return;
    }
    // Do not fire twice for the same code (failed retries stay manual).
    if (lastAttemptedRef.current === normalized) return;

    const timer = window.setTimeout(() => {
      if (pendingRef.current) return;
      lastAttemptedRef.current = normalized;
      onSubmitRef.current();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [value, enabled, delayMs]);
}
