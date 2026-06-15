'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import FormField from '@/components/FormField';
import MultiImageDrop from '@/components/MultiImageDrop';
// Type-only import: erased at build time, so the server-only lib/newsletter
// module (supabase admin client) is never pulled into this client bundle.
import type { NewsletterPhoto, PhotoFocus, NewsletterSubmissionRecord } from '@/lib/newsletter';
import MemberCard from '@/components/newsletter/MemberCard';
import { PALETTE } from '@/components/newsletter/theme';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB — matches the /api/images/upload cap

const makeId = () => Math.random().toString(36).slice(2);

// The 3x3 crop-focus grid, laid out row by row (top-left → bottom-right). Each
// value is a CSS object-position keyword; picking one decides which part of the
// photo survives the newsletter's fixed-aspect crops. Mirrors PHOTO_FOCUSES in
// lib/newsletter (kept local to avoid importing server code into the client).
const FOCUS_GRID: PhotoFocus[] = [
  'left top', 'center top', 'right top',
  'left center', 'center', 'right center',
  'left bottom', 'center bottom', 'right bottom',
];

const FOCUS_LABELS: Record<PhotoFocus, string> = {
  'left top': 'top left', 'center top': 'top', 'right top': 'top right',
  'left center': 'left', 'center': 'center', 'right center': 'right',
  'left bottom': 'bottom left', 'center bottom': 'bottom', 'right bottom': 'bottom right',
};

export interface NewsletterFormValues {
  name: string;
  period_in_k9: string;
  whats_up: string;
  where_now: string;
  hold_my_hair: string;
  email: string;
  recommendation_link: string;
  recommendation_context: string;
  happy_story: string;
  notify_for_future_newsletters: boolean;
  photos: NewsletterPhoto[];
}

// What the form hands back on submit — the validated/normalised values plus the
// honeypot field, ready to POST/PATCH as JSON.
export interface NewsletterFormPayload extends NewsletterFormValues {
  website: string; // honeypot — always empty for real users
}

interface PhotoSlot {
  id: string;
  file: File | null;
  existingUrl?: string;
  // Object URL for a newly-added file, created once when the file is added so
  // the thumbnail and the live preview share a single live URL. Revoked on
  // remove/unmount.
  previewUrl?: string;
  focus?: PhotoFocus;
}

// The display URL for a slot: the blob preview for new files, else the stored URL.
const slotUrl = (slot: PhotoSlot): string | undefined => slot.previewUrl ?? slot.existingUrl;

// A single photo card. The blob/stored URL lives on the slot (managed by the
// form) so the thumbnail and the live preview stay in sync.
//
// The preview box matches the aspect the photo will actually use in the
// newsletter — full/natural for the primary, the small polaroid ratio
// otherwise — and applies the chosen focus as object-position, so what you see
// here is the real crop. A 3x3 grid is overlaid on the small photos: click the
// region holding the subject (e.g. a face) to keep it from being cropped out.
function PhotoThumb({
  slot,
  isPrimary,
  onRemove,
  onSetFocus,
  onMakePrimary,
}: {
  slot: PhotoSlot;
  isPrimary: boolean;
  onRemove: () => void;
  onSetFocus: (focus: PhotoFocus) => void;
  onMakePrimary: () => void;
}) {
  const previewUrl = slotUrl(slot);
  if (!previewUrl) return null;

  const focus = slot.focus ?? 'center';

  return (
    <div className="w-40 space-y-1.5">
      <div
        className="relative w-full overflow-hidden rounded-lg shadow bg-gray-100"
        style={isPrimary ? undefined : { aspectRatio: '94 / 78' }}
      >
        {isPrimary ? (
          // The primary photo is shown in full (natural aspect) in the
          // newsletter, never cropped — so preview it uncropped and offer no
          // focus picker.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Selected photo" style={{ display: 'block', width: '100%', height: 'auto' }} />
        ) : (
          <>
            <Image
              src={previewUrl}
              alt="Selected photo"
              fill
              sizes="160px"
              // Newly-added files are blob: object URLs the Next image optimizer
              // can't fetch server-side; render them directly. Existing (https)
              // photos can still go through the optimizer.
              unoptimized={Boolean(slot.file)}
              style={{ objectFit: 'cover', objectPosition: focus }}
            />

            {/* Focus picker overlaid on the image — click where the subject is. */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {FOCUS_GRID.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => onSetFocus(pos)}
                  aria-label={`Focus crop on ${FOCUS_LABELS[pos]}`}
                  aria-pressed={focus === pos}
                  className="group flex items-center justify-center hover:bg-black/10"
                >
                  <span
                    className={
                      focus === pos
                        ? 'block w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white shadow'
                        : 'block w-1.5 h-1.5 rounded-full bg-white/70 ring-1 ring-black/10 opacity-60 group-hover:opacity-100'
                    }
                  />
                </button>
              ))}
            </div>
          </>
        )}

        {isPrimary && (
          <span className="absolute top-1 left-1 z-10 rounded-full bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 shadow">
            Primary
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute top-1 right-1 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-sm shadow hover:bg-red-600"
        >
          ×
        </button>
      </div>

      {isPrimary ? (
        <p className="text-[11px] text-gray-400 text-center">Primary · shown in full</p>
      ) : (
        <button
          type="button"
          onClick={onMakePrimary}
          className="w-full text-[11px] font-medium text-blue-600 hover:text-blue-700"
        >
          ★ Make primary
        </button>
      )}
    </div>
  );
}

interface NewsletterFormProps {
  initialValues?: Partial<NewsletterFormValues>;
  submitText: string;
  // Throws an Error (its message is shown to the user) on failure.
  onSubmit: (payload: NewsletterFormPayload) => Promise<void>;
  // Sets the id on the <form> element so a submit button rendered outside the
  // form (e.g. in a sticky save bar) can target it via the `form` attribute.
  formId?: string;
  // Notified whenever the form's edited/pristine state changes — lets a parent
  // (e.g. the edit page) show an "unsaved changes" reminder.
  onDirtyChange?: (dirty: boolean) => void;
  // Notified while a submit is in flight, so an external save button can show a
  // loading state and disable itself.
  onSubmittingChange?: (submitting: boolean) => void;
}

// Serialises the editable fields (text + photos) so the current state can be
// compared against the pristine snapshot to detect unsaved changes. Photo slots
// are reduced to url + focus + a marker for newly-added files (which are always
// a change, since the pristine set never has files).
function valuesSignature(values: NewsletterFormValues): string {
  // Photos are tracked separately (see photosSignature); drop the field here.
  return JSON.stringify({ ...values, photos: undefined });
}

function photosSignature(slots: PhotoSlot[]): string {
  return JSON.stringify(
    slots.map((s) => ({ u: s.existingUrl ?? null, f: s.focus ?? null, n: s.file ? s.id : null }))
  );
}

const EMPTY: NewsletterFormValues = {
  name: '',
  period_in_k9: '',
  whats_up: '',
  where_now: '',
  hold_my_hair: '',
  email: '',
  recommendation_link: '',
  recommendation_context: '',
  happy_story: '',
  notify_for_future_newsletters: false,
  photos: [],
};

export default function NewsletterForm({ initialValues, submitText, onSubmit, formId, onDirtyChange, onSubmittingChange }: NewsletterFormProps) {
  const [values, setValues] = useState<NewsletterFormValues>({ ...EMPTY, ...initialValues });
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    (initialValues?.photos ?? []).map((p) => ({ id: makeId(), file: null, existingUrl: p.url, focus: p.focus }))
  );
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compare the current state against the pristine snapshot (captured on first
  // render) and report dirtiness to the parent.
  const currentSig = { v: valuesSignature(values), p: photosSignature(photos) };
  const pristineSig = useRef(currentSig);
  const dirty = currentSig.v !== pristineSig.current.v || currentSig.p !== pristineSig.current.p;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  // Revoke any outstanding blob URLs when the form unmounts.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(
    () => () => photosRef.current.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl)),
    []
  );

  const set = <K extends keyof NewsletterFormValues>(field: K, value: NewsletterFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const removePhoto = (id: string) => {
    setPhotoNotice(null);
    setPhotos((prev) => {
      const gone = prev.find((slot) => slot.id === id);
      if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
      return prev.filter((slot) => slot.id !== id);
    });
  };

  const setPhotoFocus = (id: string, focus: PhotoFocus) => {
    setPhotos((prev) => prev.map((slot) => (slot.id === id ? { ...slot, focus } : slot)));
  };

  // Promote a photo to the lead slot (index 0). Order is the only thing that
  // marks the lead, both here and in the rendered newsletter.
  const makePrimary = (id: string) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((slot) => slot.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
  };

  // Accepts a batch of dropped/selected files: validates type + size, fills the
  // remaining slots up to MAX_PHOTOS, and reports anything skipped in one notice.
  const addPhotos = (files: File[]) => {
    setPhotoNotice(null);
    setPhotos((prev) => {
      const slotsLeft = MAX_PHOTOS - prev.length;
      if (slotsLeft <= 0) {
        setPhotoNotice(`You can add at most ${MAX_PHOTOS} photos.`);
        return prev;
      }

      const accepted: PhotoSlot[] = [];
      let badType = 0;
      let tooLarge = 0;
      let overflow = 0;

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          badType++;
          continue;
        }
        if (file.size > MAX_PHOTO_BYTES) {
          tooLarge++;
          continue;
        }
        if (accepted.length >= slotsLeft) {
          overflow++;
          continue;
        }
        accepted.push({ id: makeId(), file, previewUrl: URL.createObjectURL(file) });
      }

      const skipped: string[] = [];
      if (badType) skipped.push(`${badType} not an image`);
      if (tooLarge) skipped.push(`${tooLarge} over 5 MB`);
      if (overflow) skipped.push(`${overflow} over the ${MAX_PHOTOS}-photo limit`);
      if (skipped.length) setPhotoNotice(`Skipped: ${skipped.join(', ')}.`);

      return accepted.length ? [...prev, ...accepted] : prev;
    });
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to upload a photo. Please try again.');
    }
    const { url } = await res.json();
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !values.name.trim() ||
      !values.period_in_k9.trim() ||
      !values.whats_up.trim() ||
      !values.email.trim()
    ) {
      setError('Please fill in your name, K9 lifespan, what you\'re up to, and your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Resolve each photo slot to { url, focus }: upload new files, keep
      // existing URLs, drop empty slots. Order is preserved, so slot 0 (the
      // lead) stays the lead. Only carry a focus when it differs from centre.
      const resolvedPhotos: NewsletterPhoto[] = [];
      for (const slot of photos) {
        const url = slot.file ? await uploadPhoto(slot.file) : slot.existingUrl;
        if (!url) continue;
        resolvedPhotos.push(slot.focus && slot.focus !== 'center' ? { url, focus: slot.focus } : { url });
      }

      await onSubmit({ ...values, photos: resolvedPhotos.slice(0, MAX_PHOTOS), website: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // A submission-shaped object built from the live form state, fed to the shared
  // MemberCard so the preview matches the real newsletter exactly. Empty
  // required fields get gentle placeholders so the preview reads as a real post.
  const previewPhotos: NewsletterPhoto[] = [];
  for (const slot of photos) {
    const url = slotUrl(slot);
    if (!url) continue;
    previewPhotos.push(slot.focus ? { url, focus: slot.focus } : { url });
  }

  const previewSubmission: NewsletterSubmissionRecord = {
    id: 'preview',
    name: values.name.trim() || 'Your name',
    period_in_k9: values.period_in_k9.trim(),
    whats_up: values.whats_up.trim() || 'Share what you’re up to — your words will appear here as you type.',
    where_now: values.where_now.trim() || null,
    hold_my_hair: values.hold_my_hair.trim() || null,
    email: values.email.trim() || null,
    recommendation_link: values.recommendation_link.trim() || null,
    recommendation_context: values.recommendation_context.trim() || null,
    happy_story: values.happy_story.trim() || null,
    photos: previewPhotos,
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <form id={formId} onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-6 bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      {/* Honeypot: hidden from real users, tempting to bots. Never populated by
          humans, so a non-empty value gets the submission silently dropped. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
        value=""
        onChange={() => {}}
        readOnly
      />

      <FormField label="A picture (or more) is worth a 1000 words they say. Show us the world through your eyes">
        <div className="space-y-4">
          <MultiImageDrop onAdd={addPhotos} remaining={MAX_PHOTOS - photos.length} />

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-4 items-start">
              {photos.map((slot, i) => (
                <PhotoThumb
                  key={slot.id}
                  slot={slot}
                  isPrimary={i === 0}
                  onRemove={() => removePhoto(slot.id)}
                  onSetFocus={(focus) => setPhotoFocus(slot.id, focus)}
                  onMakePrimary={() => makePrimary(slot.id)}
                />
              ))}
            </div>
          )}

          {photoNotice && <p className="text-sm text-amber-600">{photoNotice}</p>}
        </div>
      </FormField>

      <FormField label="What should we call you?" required>
        <input
          type="text"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          className="form-input"
          placeholder="Your name"
        />
      </FormField>

      <FormField label="Your K9 Lifespan" required>
        <input
          type="text"
          required
          value={values.period_in_k9}
          onChange={(e) => set('period_in_k9', e.target.value)}
          className="form-input"
          placeholder={'e.g. Summer 2021 – Spring 2023 — or "still here!"'}
        />
      </FormField>

      <FormField label="What are you up to?" required>
        <textarea
          required
          rows={4}
          value={values.whats_up}
          onChange={(e) => set('whats_up', e.target.value)}
          className="form-input"
          placeholder="What's new with you? Big news, small wins, everyday moments…"
        />
      </FormField>

      <FormField label="How to get in touch" required>
        <input
          type="email"
          required
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          className="form-input"
          placeholder="you@awesomemail.com — for the newsletter & your edit link"
        />
      </FormField>

      <FormField label="Where are you now?">
        <input
          type="text"
          value={values.where_now}
          onChange={(e) => set('where_now', e.target.value)}
          className="form-input"
          placeholder="City, country, or wherever life has taken you"
        />
      </FormField>

      <FormField label="What do you need help with?">
        <textarea
          rows={2}
          value={values.hold_my_hair}
          onChange={(e) => set('hold_my_hair', e.target.value)}
          className="form-input"
          placeholder="Anything we could support you with?"
        />
      </FormField>

      <FormField label="Something nice you'd like to recommend">
        <div className="space-y-2">
          <input
            type="text"
            value={values.recommendation_link}
            onChange={(e) => set('recommendation_link', e.target.value)}
            className="form-input"
            placeholder="A book, song, place, something that inspired you"
          />
          <textarea
            rows={2}
            value={values.recommendation_context}
            onChange={(e) => set('recommendation_context', e.target.value)}
            className="form-input"
            placeholder="Add a description, and why it's worth checking out"
          />
        </div>
      </FormField>

      <FormField label="Share a Newsletter success story?">
        <textarea
          rows={3}
          value={values.happy_story}
          onChange={(e) => set('happy_story', e.target.value)}
          className="form-input"
          placeholder="e.g. someone reached out or you did after reading the news, say thanks for a tip"
        />
      </FormField>

      <FormField label="">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={values.notify_for_future_newsletters}
            onChange={(e) => set('notify_for_future_newsletters', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Let me know about future newsletters
          </span>
        </label>
      </FormField>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-6 py-2 disabled:opacity-50">
          {isSubmitting ? 'Submitting…' : submitText}
        </button>
      </div>
      </form>

      {/* Live preview — the real MemberCard, fed by the current form state. On
          mobile it stacks below the form; on desktop it sticks beside it. */}
      <aside className="lg:w-[480px] lg:shrink-0">
        <div className="space-y-2 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Live preview</p>
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: '#FAF4E4' }}>
            <MemberCard s={previewSubmission} palette={PALETTE[0]} preview />
          </div>
        </div>
      </aside>
    </div>
  );
}
