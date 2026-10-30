/**
 * Identical toasts fired in a burst (triple-clicking "Share", double-saving a
 * form) should not pile up. Only plain-text toasts are compared: JSX titles
 * cannot be compared safely, so those always get their own card.
 */
export const TOAST_DEDUPE_WINDOW_MS = 1500;

export interface ToastLike {
  title?: unknown;
  description?: unknown;
  variant?: string | null;
  createdAt?: number;
  open?: boolean | null;
}

export function toastSignature(toast: ToastLike): string | null {
  const title = typeof toast.title === 'string' ? toast.title : null;
  const description =
    typeof toast.description === 'string' ? toast.description : null;
  if (title === null && description === null) return null;
  return `${toast.variant ?? 'default'}|${title ?? ''}|${description ?? ''}`;
}

/** The most recent still-open toast that matches within the dedupe window. */
export function findDuplicateToast<T extends ToastLike>(
  toasts: T[],
  candidate: ToastLike,
  now = Date.now(),
): T | undefined {
  const signature = toastSignature(candidate);
  if (!signature) return undefined;

  return toasts.find(
    (toast) =>
      toast.open !== false &&
      toastSignature(toast) === signature &&
      now - (toast.createdAt ?? 0) < TOAST_DEDUPE_WINDOW_MS,
  );
}
