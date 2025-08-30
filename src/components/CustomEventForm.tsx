'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';
import FormField from './FormField';
import FormButtons from './FormButtons';
import ImageUpload from './ImageUpload';

interface CustomEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CustomEventFormData) => Promise<void>;
}

interface CustomEventFormData {
  organizerName: string;
  organizerEmail: string;
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  startDateTime: string;
  duration: string;
  infoLink: string;
  visualUrl: string;
  visualFile: File | null;
  additionalNotes: string;
}

export default function CustomEventForm({ isOpen, onClose, onSubmit }: CustomEventFormProps) {
  const [formData, setFormData] = useState<CustomEventFormData>({
    organizerName: '',
    organizerEmail: '',
    eventTitle: '',
    eventDescription: '',
    eventLocation: '',
    startDateTime: '',
    duration: '',
    infoLink: '',
    visualUrl: '',
    visualFile: null,
    additionalNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomEventFormData>>({});

  const validateField = (fieldName: keyof CustomEventFormData, value: string): boolean => {
    let error = '';
    
    switch (fieldName) {
      case 'organizerName':
        if (!value.trim()) {
          error = 'Your name is required';
        }
        break;
      case 'organizerEmail':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'eventTitle':
        if (!value.trim()) {
          error = 'Event title is required';
        }
        break;
      case 'eventDescription':
        if (!value.trim()) {
          error = 'Please describe what your event is about';
        }
        break;
      case 'eventLocation':
        if (!value.trim()) {
          error = 'Event location is required';
        }
        break;
      case 'startDateTime':
        if (!value) {
          error = 'Start date and time is required';
        }
        break;
      case 'duration':
        if (!value.trim()) {
          error = 'Event duration is required';
        }
        break;
      case 'infoLink':
        if (value && !value.match(/^https?:\/\/.+/)) {
          error = 'Please enter a valid URL (starting with http:// or https://)';
        }
        break;
      case 'visualUrl':
        if (value && !value.match(/^https?:\/\/.+/)) {
          error = 'Please enter a valid URL (starting with http:// or https://)';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof CustomEventFormData)[] = [
      'organizerName', 'organizerEmail', 'eventTitle', 'eventDescription', 
      'eventLocation', 'startDateTime', 'duration'
    ];
    
    let isValid = true;
    requiredFields.forEach(field => {
      const value = formData[field];
      if (typeof value === 'string' && !validateField(field, value)) {
        isValid = false;
      }
    });

    // Validate optional URL fields
    if (formData.infoLink && !validateField('infoLink', formData.infoLink)) {
      isValid = false;
    }
    if (formData.visualUrl && !validateField('visualUrl', formData.visualUrl)) {
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let finalVisualUrl = formData.visualUrl;
      
      // Upload image if a file was selected
      if (formData.visualFile) {
        finalVisualUrl = await ImageUpload.uploadToSupabase(formData.visualFile);
      }

      const submissionData = {
        ...formData,
        visualUrl: finalVisualUrl
      };

      await onSubmit(submissionData);
      
      // Reset form
      setFormData({
        organizerName: '',
        organizerEmail: '',
        eventTitle: '',
        eventDescription: '',
        eventLocation: '',
        startDateTime: '',
        duration: '',
        infoLink: '',
        visualUrl: '',
        visualFile: null,
        additionalNotes: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting event:', error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldName: keyof CustomEventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleFieldBlur = (fieldName: keyof CustomEventFormData, value: string) => {
    validateField(fieldName, value);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a Custom Event"
    >
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Share your event with the K9 community! Whether it&apos;s a meetup, party, or any gathering, let everyone know.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Event Image">
          <ImageUpload
            label=""
            value={formData.visualFile}
            onChange={(file) => setFormData(prev => ({ ...prev, visualFile: file, visualUrl: file ? '' : prev.visualUrl }))}
          />
        </FormField>

        <FormField label="Your Name" required error={errors.organizerName}>
          <input
            type="text"
            value={formData.organizerName}
            onChange={(e) => handleFieldChange('organizerName', e.target.value)}
            onBlur={(e) => handleFieldBlur('organizerName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
          />
        </FormField>

        <FormField label="Email" required error={errors.organizerEmail}>
          <input
            type="email"
            value={formData.organizerEmail}
            onChange={(e) => handleFieldChange('organizerEmail', e.target.value)}
            onBlur={(e) => handleFieldBlur('organizerEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
          />
        </FormField>

        <FormField label="Event Title" required error={errors.eventTitle}>
          <input
            type="text"
            value={formData.eventTitle}
            onChange={(e) => handleFieldChange('eventTitle', e.target.value)}
            onBlur={(e) => handleFieldBlur('eventTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's the name of your event?"
          />
        </FormField>

        <FormField label="What is your event about?" required error={errors.eventDescription}>
          <textarea
            value={formData.eventDescription}
            onChange={(e) => handleFieldChange('eventDescription', e.target.value)}
            onBlur={(e) => handleFieldBlur('eventDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe your event, what to expect, who should come, etc."
          />
        </FormField>

        <FormField label="Where is your event?" required error={errors.eventLocation}>
          <input
            type="text"
            value={formData.eventLocation}
            onChange={(e) => handleFieldChange('eventLocation', e.target.value)}
            onBlur={(e) => handleFieldBlur('eventLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Address, venue name, or virtual meeting link"
          />
        </FormField>

        <FormField label="When does your event start?" required error={errors.startDateTime}>
          <input
            type="datetime-local"
            value={formData.startDateTime}
            onChange={(e) => handleFieldChange('startDateTime', e.target.value)}
            onBlur={(e) => handleFieldBlur('startDateTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="900"
          />
        </FormField>

        <FormField label="How long will your event last?" required error={errors.duration}>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => handleFieldChange('duration', e.target.value)}
            onBlur={(e) => handleFieldBlur('duration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 2 hours, 3-4 hours, all day, etc."
          />
        </FormField>

        <FormField label="Link for more info" error={errors.infoLink}>
          <input
            type="url"
            value={formData.infoLink}
            onChange={(e) => handleFieldChange('infoLink', e.target.value)}
            onBlur={(e) => handleFieldBlur('infoLink', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/event-details"
          />
        </FormField>

        <FormField label="Anything else we need to know?">
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Special instructions, RSVP requirements, etc."
          />
        </FormField>

        <FormButtons
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitText="Create Event"
        />
      </form>
    </BaseModal>
  );
}