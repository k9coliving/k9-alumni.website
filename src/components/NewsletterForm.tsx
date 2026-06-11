'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import FormField from '@/components/FormField';
import MultiImageDrop from '@/components/MultiImageDrop';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB — matches the /api/images/upload cap

const makeId = () => Math.random().toString(36).slice(2);

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
  notify_for_next_newsletter: boolean;
  photo_urls: string[];
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
}

// A single thumbnail. Owns the object-URL lifecycle for newly-added files: the
// URL is created inside the effect and stored in state, so the rendered src
// always points at a live URL (creating it in render + revoking in cleanup
// breaks under React Strict Mode's dev double-mount). Existing photos use their
// stored URL directly.
function PhotoThumb({ slot, onRemove }: { slot: PhotoSlot; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(slot.existingUrl ?? null);

  useEffect(() => {
    if (!slot.file) return;
    const url = URL.createObjectURL(slot.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [slot.file]);

  if (!previewUrl) return null;

  return (
    <div className="relative w-24 h-24">
      <Image
        src={previewUrl}
        alt="Selected photo"
        width={96}
        height={96}
        // Newly-added files are blob: object URLs the Next image optimizer can't
        // fetch server-side; render them directly. Existing (https) photos can
        // still go through the optimizer.
        unoptimized={Boolean(slot.file)}
        className="w-24 h-24 object-cover rounded-lg shadow"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-sm shadow hover:bg-red-600"
      >
        ×
      </button>
    </div>
  );
}

interface NewsletterFormProps {
  initialValues?: Partial<NewsletterFormValues>;
  submitText: string;
  // Throws an Error (its message is shown to the user) on failure.
  onSubmit: (payload: NewsletterFormPayload) => Promise<void>;
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
  notify_for_next_newsletter: false,
  photo_urls: [],
};

export default function NewsletterForm({ initialValues, submitText, onSubmit }: NewsletterFormProps) {
  const [values, setValues] = useState<NewsletterFormValues>({ ...EMPTY, ...initialValues });
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    (initialValues?.photo_urls ?? []).map((url) => ({ id: makeId(), file: null, existingUrl: url }))
  );
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof NewsletterFormValues>(field: K, value: NewsletterFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const removePhoto = (id: string) => {
    setPhotoNotice(null);
    setPhotos((prev) => prev.filter((slot) => slot.id !== id));
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
        accepted.push({ id: makeId(), file });
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
      // Resolve each photo slot to a URL: upload new files, keep existing URLs,
      // drop empty slots.
      const photoUrls: string[] = [];
      for (const slot of photos) {
        if (slot.file) {
          photoUrls.push(await uploadPhoto(slot.file));
        } else if (slot.existingUrl) {
          photoUrls.push(slot.existingUrl);
        }
      }

      await onSubmit({ ...values, photo_urls: photoUrls.slice(0, MAX_PHOTOS), website: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-lg p-6 sm:p-8">
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
            <div className="flex flex-wrap gap-3">
              {photos.map((slot) => (
                <PhotoThumb key={slot.id} slot={slot} onRemove={() => removePhoto(slot.id)} />
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
            checked={values.notify_for_next_newsletter}
            onChange={(e) => set('notify_for_next_newsletter', e.target.checked)}
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
  );
}
