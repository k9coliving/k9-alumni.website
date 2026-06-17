// Pure, dependency-free helper shared by the residents API (server) and the
// profile form (client) — keep it free of any server-only imports.
//
// A resident is a newsletter subscriber when their involvement level is one of
// these OR they're flagged as a team member. Mirrors the recipient criteria
// that used to live in getNewsletterSubscribedResidents.
export const SUBSCRIBABLE_INVOLVEMENT_LEVELS = [
  'full-engagement',
  'newsletter-only',
  'team-member',
] as const;

export function isSubscribableInvolvement(
  involvementLevel?: string | null,
  isTeamMember?: boolean
): boolean {
  if (isTeamMember === true) return true;
  return (
    !!involvementLevel &&
    (SUBSCRIBABLE_INVOLVEMENT_LEVELS as readonly string[]).includes(involvementLevel)
  );
}
