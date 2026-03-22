/** Fired after `profiles` changes (e.g. avatar) so shell UI can refetch. */
export const PROFILE_UPDATED_EVENT = 'fmc-profile-updated';

export function dispatchProfileUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
  }
}
