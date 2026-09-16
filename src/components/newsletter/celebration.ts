import type { CelebrationRsvp } from '@/lib/newsletter';

// The "10 years of K9" celebration RSVP, as shown to participants — shared by
// the submission form's pills and the member card's band so the wording can't
// drift. Client-safe on purpose (lib/newsletter is server-only); it imports
// only the type.
export const CELEBRATION_QUESTION = 'Are you coming to 10 years of K9 in Stockholm?';

// `label` is the pill in the form; `answer` is how the choice reads on the
// member card (same words, different emoji).
export const CELEBRATION_RSVP_OPTIONS: { value: CelebrationRsvp; label: string; answer: string }[] = [
  { value: 'yes', label: 'Yes, definitely 🙌', answer: 'Yes, definitely 👍🎉' },
  { value: 'no', label: 'No 😔', answer: 'No 😕' },
  { value: 'maybe', label: 'Maybe?', answer: 'Maybe? 🤷‍♀️' },
];

export const celebrationAnswer = (value: CelebrationRsvp): string =>
  CELEBRATION_RSVP_OPTIONS.find((o) => o.value === value)?.answer ?? value;
