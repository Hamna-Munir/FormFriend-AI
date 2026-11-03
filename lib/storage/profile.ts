import { EMPTY_PROFILE, ProfileSchema, type Profile } from "@/lib/schemas/eligibility";

const KEY = "formfriend:profile:v1";

/** localStorage can be missing or throw (private mode, blocked data), so every access is guarded. */
export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = ProfileSchema.safeParse({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
    return parsed.success ? parsed.data : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore: the profile simply will not be remembered */
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
