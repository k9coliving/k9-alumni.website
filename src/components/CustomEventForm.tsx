'use client';

import { useState, useEffect } from 'react';
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

  // Handle Escape key to close modal and prevent background scrolling
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      // Restore background scrolling
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

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
      if (!validateField(field, formData[field])) {
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Create a Custom Event</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Share your event with the K9 community! Whether it's a meetup, party, or any gathering, let everyone know.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Image Upload Section */}
            <ImageUpload
              label="Event Image"
              value={formData.visualFile}
              onChange={(file) => setFormData(prev => ({ ...prev, visualFile: file, visualUrl: file ? '' : prev.visualUrl }))}
              placeholder="Add a visual for your event - drag and drop an image here, or browse"
            />

            {/* Organizer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.organizerName}
                onChange={(e) => handleFieldChange('organizerName', e.target.value)}
                onBlur={(e) => handleFieldBlur('organizerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
              <div className="h-6">
                {errors.organizerName && <p className="text-red-500 text-sm mt-1">{errors.organizerName}</p>}
              </div>
            </div>

            {/* Organizer Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.organizerEmail}
                onChange={(e) => handleFieldChange('organizerEmail', e.target.value)}
                onBlur={(e) => handleFieldBlur('organizerEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
              />
              <div className="h-6">
                {errors.organizerEmail && <p className="text-red-500 text-sm mt-1">{errors.organizerEmail}</p>}
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.eventTitle}
                onChange={(e) => handleFieldChange('eventTitle', e.target.value)}
                onBlur={(e) => handleFieldBlur('eventTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What's the name of your event?"
              />
              <div className="h-6">
                {errors.eventTitle && <p className="text-red-500 text-sm mt-1">{errors.eventTitle}</p>}
              </div>
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What is your event about? *
              </label>
              <textarea
                value={formData.eventDescription}
                onChange={(e) => handleFieldChange('eventDescription', e.target.value)}
                onBlur={(e) => handleFieldBlur('eventDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe your event, what to expect, who should come, etc."
              />
              <div className="h-6">
                {errors.eventDescription && <p className="text-red-500 text-sm mt-1">{errors.eventDescription}</p>}
              </div>
            </div>

            {/* Event Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Where is your event? *
              </label>
              <input
                type="text"
                value={formData.eventLocation}
                onChange={(e) => handleFieldChange('eventLocation', e.target.value)}
                onBlur={(e) => handleFieldBlur('eventLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Address, venue name, or virtual meeting link"
              />
              <div className="h-6">
                {errors.eventLocation && <p className="text-red-500 text-sm mt-1">{errors.eventLocation}</p>}
              </div>
            </div>

            {/* Start DateTime */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When does your event start? *
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => handleFieldChange('startDateTime', e.target.value)}
                onBlur={(e) => handleFieldBlur('startDateTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="900"
              />
              <div className="h-6">
                {errors.startDateTime && <p className="text-red-500 text-sm mt-1">{errors.startDateTime}</p>}
              </div>
            </div>

            {/* Event Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How long will your event last? *
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleFieldChange('duration', e.target.value)}
                onBlur={(e) => handleFieldBlur('duration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2 hours, 3-4 hours, all day, etc."
              />
              <div className="h-6">
                {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
              </div>
            </div>

            {/* Info Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link for more info
              </label>
              <input
                type="url"
                value={formData.infoLink}
                onChange={(e) => handleFieldChange('infoLink', e.target.value)}
                onBlur={(e) => handleFieldBlur('infoLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/event-details"
              />
              <div className="h-6">
                {errors.infoLink && <p className="text-red-500 text-sm mt-1">{errors.infoLink}</p>}
              </div>
            </div>


            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anything else we need to know?
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Special instructions, RSVP requirements, etc."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}