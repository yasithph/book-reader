export const PREDEFINED_AVATARS = Array.from(
  { length: 10 },
  (_, i) => `/images/avatars/avatar-${i}.png`
);

/** Deterministic default avatar based on userId */
export function getDefaultAvatarUrl(userId: string): string {
  const charCode = userId.length > 0 ? userId.charCodeAt(0) : 0;
  const index = charCode % 10;
  return PREDEFINED_AVATARS[index];
}

/** Returns custom avatar if set, otherwise deterministic default */
export function getAvatarUrl(avatarUrl: string | null, userId: string): string {
  return avatarUrl || getDefaultAvatarUrl(userId);
}
