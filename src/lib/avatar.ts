/**
 * Avatar storage keys are `avatars/<userId>.avif`. IDs are usually cuids but
 * seeded/legacy accounts can have short numeric ids ("1"), so the route must
 * accept both — while still rejecting slashes/dots that could escape the key.
 */
const AVATAR_USER_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function isAvatarUserId(value: string): boolean {
  return AVATAR_USER_ID.test(value);
}
