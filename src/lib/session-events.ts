export const SESSION_REFRESH_CHANNEL = 'platinum-showcase:session';

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null;
  }
  channel ??= new BroadcastChannel(SESSION_REFRESH_CHANNEL);
  return channel;
}

/** Tell the other open tabs to re-read the session after an identity change. */
export function announceSessionRefresh(): void {
  getChannel()?.postMessage('refresh');
}
