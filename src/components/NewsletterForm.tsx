'use client';

import { useState } from 'react';
import FormField from '@/components/FormField';
import ImageUpload from '@/components/ImageUpload';

const MAX_PHOTOS = 5;

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
  file: File | null;
  existingUrl?: string;
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
    (initialValues?.photo_urls ?? []).map((url) => ({ file: null, existingUrl: url }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof NewsletterFormValues>(field: K, value: NewsletterFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const updatePhoto = (index: number, file: File | null) => {
    setPhotos((prev) => prev.map((slot, i) => (i === index ? { ...slot, file } : slot)));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addPhotoSlot = () => {
    setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, { file: null }] : prev));
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

    if (!values.name.trim() || !values.period_in_k9.trim() || !values.whats_up.trim()) {
      setError('Please fill in your name, your period in K9, and "What\'s up".');
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

      <FormField label="Your name" required>
        <input
          type="text"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          className="form-input"
          placeholder="What should we call you?"
        />
      </FormField>

      <FormField label="When were you at K9?" required>
        <input
          type="text"
          required
          value={values.period_in_k9}
          onChange={(e) => set('period_in_k9', e.target.value)}
          className="form-input"
          placeholder="e.g. Summer 2021 – Spring 2023"
        />
      </FormField>

      <FormField label="What's up?" required>
        <textarea
          required
          rows={4}
          value={values.whats_up}
          onChange={(e) => set('whats_up', e.target.value)}
          className="form-input"
          placeholder="What's new with you? Big news, small wins, everyday moments…"
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

      <FormField label="Hold my hair">
        <textarea
          rows={3}
          value={values.hold_my_hair}
          onChange={(e) => set('hold_my_hair', e.target.value)}
          className="form-input"
          placeholder="Need a hand with something? Tell the community what you're after."
        />
      </FormField>

      <FormField label="Get in touch — your email">
        <input
          type="email"
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          className="form-input"
          placeholder="you@example.com — we'll also email you an edit link"
        />
      </FormField>

      <FormField label="A recommendation — link">
        <input
          type="text"
          value={values.recommendation_link}
          onChange={(e) => set('recommendation_link', e.target.value)}
          className="form-input"
          placeholder="A book, song, place, anything worth sharing"
        />
      </FormField>

      <FormField label="Why do you recommend it?">
        <textarea
          rows={2}
          value={values.recommendation_context}
          onChange={(e) => set('recommendation_context', e.target.value)}
          className="form-input"
          placeholder="A line or two of context"
        />
      </FormField>

      <FormField label="A K9 happy story">
        <textarea
          rows={3}
          value={values.happy_story}
          onChange={(e) => set('happy_story', e.target.value)}
          className="form-input"
          placeholder="A memory that still makes you smile"
        />
      </FormField>

      <FormField label="Photos (up to 5)">
        <div className="space-y-4">
          {photos.map((slot, index) => (
            <div key={index} className="space-y-1">
              <ImageUpload
                label=""
                value={slot.file}
                existingUrl={slot.existingUrl}
                onChange={(file) => updatePhoto(index, file)}
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Remove this photo
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={addPhotoSlot}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Add a photo
            </button>
          )}
        </div>
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
            Notify me when the next newsletter is coming
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
