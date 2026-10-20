export const PROFILE_PAGE_SIZE = 8;

export const PROFILE_SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'most-voted', label: 'Most voted' },
  { value: 'least-voted', label: 'Least voted' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'platform-asc', label: 'Platform A-Z' },
  { value: 'platform-desc', label: 'Platform Z-A' },
] as const;

export type ProfileSort = (typeof PROFILE_SORTS)[number]['value'];

export const DEFAULT_PROFILE_SORT: ProfileSort = 'newest';

export function parseProfileSort(value?: string): ProfileSort {
  return PROFILE_SORTS.some((option) => option.value === value)
    ? (value as ProfileSort)
    : DEFAULT_PROFILE_SORT;
}

export const PROFILE_PLATFORM_FILTERS = [
  { value: 'all', label: 'All platforms' },
  { value: 'PS5', label: 'PlayStation 5' },
  { value: 'PS4', label: 'PlayStation 4' },
  { value: 'PS3', label: 'PlayStation 3' },
] as const;

export type ProfilePlatformFilter =
  (typeof PROFILE_PLATFORM_FILTERS)[number]['value'];

export const DEFAULT_PROFILE_PLATFORM: ProfilePlatformFilter = 'all';

export function parseProfilePlatform(value?: string): ProfilePlatformFilter {
  return PROFILE_PLATFORM_FILTERS.some((option) => option.value === value)
    ? (value as ProfilePlatformFilter)
    : DEFAULT_PROFILE_PLATFORM;
}
