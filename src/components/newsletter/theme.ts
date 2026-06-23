// Design tokens for the rendered newsletter ("Nest" Canva design), shared by the
// public newsletter view and the submission-form live preview so the two can't
// drift apart.

export const FONT_DISPLAY = "var(--font-baloo2), 'Baloo 2', system-ui, sans-serif";
export const FONT_BODY = "var(--font-nunito), 'Nunito', system-ui, sans-serif";
export const FONT_HAND = "var(--font-caveat), 'Caveat', cursive";

export const INK = '#16294C';

export interface Palette {
  accent: string;
  soft: string;
  deep: string;
}

export const PALETTE: Palette[] = [
  { accent: '#5B7FD4', soft: '#E0E8F8', deep: '#39539E' }, // blue
  { accent: '#E7A92F', soft: '#FBEBC2', deep: '#B97E10' }, // yellow
  { accent: '#EA8088', soft: '#FBE2E4', deep: '#C2545E' }, // pink
  { accent: '#7FA968', soft: '#E3EDD6', deep: '#557A40' }, // green
];

export const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;
