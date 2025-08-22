'use client';

import { useState } from 'react';

interface AddProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

interface FormData {
  name: string;
  email: string;
  location: string;
  profession: string;
  yearsInK9: string;
  description: string;
  interests: string[];
  photoUrl: string;
}

export default function AddProfileForm({ isOpen, onClose, onSubmit }: AddProfileFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    location: '',
    profession: '',
    yearsInK9: '',
    description: '',
    interests: [],
    photoUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }



    if (!formData.yearsInK9) {
      newErrors.yearsInK9 = 'K9 period is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        email: '',
        location: '',
        profession: '',
        yearsInK9: '',
        description: '',
        interests: [],
        photoUrl: ''
      });
      onClose();
    } catch (error) {
      console.error('Error submitting profile:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            <h2 className="text-xl font-bold text-gray-900">Tell us who you are</h2>
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
              Let&apos;s take care of each other beyond the walls of K9.
            </p>
            <p className="text-sm text-gray-600 mt-3">
              This information will be accessible to other K9 alumni and current residents. Only share what you are comfortable sharing 😊
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who are you? *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email so we can stay in touch *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Where do you live?
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City, Country, nomad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What do you do?
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When did you live at K9? *
              </label>
              <input
                type="text"
                value={formData.yearsInK9}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsInK9: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.yearsInK9 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. 2020-2021, November 2016 - June 2018, etc."
              />
              {errors.yearsInK9 && <p className="text-red-500 text-sm mt-1">{errors.yearsInK9}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Photo URL
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Add a link to your profile photo (from LinkedIn, social media, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interests
              </label>
              <input
                type="text"
                value={formData.interests.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  interests: e.target.value.split(',').map(interest => interest.trim()).filter(Boolean)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=""
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate multiple interests with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What else do you want alumni/residents to know about you?
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Tell us a bit about yourself, what you're up to, or what you're looking for from the K9 community..."
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
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}