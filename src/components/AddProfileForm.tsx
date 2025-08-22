'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';

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
  photoFile: File | null;
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
    photoUrl: '',
    photoFile: null
  });

  // Local state for input values to prevent re-renders
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [localYearsInK9, setLocalYearsInK9] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setFormData(prev => ({ ...prev, photoFile: file, photoUrl: '' }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  }, [handleFileSelect]);

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploadProgress(0);
      
      // Upload to Supabase storage
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setUploadProgress(100);
      
      return url;
    } catch (error) {
      setUploadProgress(null);
      throw error;
    }
  };

  const validateField = useCallback((fieldName: keyof FormData, value: string) => {
    let error = '';
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          error = 'Name is required';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'yearsInK9':
        if (!value) {
          error = 'K9 period is required';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  }, []);

  const validateForm = useCallback((): boolean => {
    const nameValid = validateField('name', formData.name);
    const emailValid = validateField('email', formData.email);
    const yearsValid = validateField('yearsInK9', formData.yearsInK9);

    return nameValid && emailValid && yearsValid;
  }, [formData.name, formData.email, formData.yearsInK9, validateField]);

  // Memoize the preview URL to prevent flickering on re-renders
  const previewUrl = useMemo(() => {
    if (formData.photoFile) {
      return URL.createObjectURL(formData.photoFile);
    }
    return null;
  }, [formData.photoFile]);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhotoUrl = formData.photoUrl;
      
      // Upload image if a file was selected
      if (formData.photoFile) {
        finalPhotoUrl = await uploadImageToSupabase(formData.photoFile);
      }

      const submissionData = {
        ...formData,
        photoUrl: finalPhotoUrl
      };

      await onSubmit(submissionData);
      setFormData({
        name: '',
        email: '',
        location: '',
        profession: '',
        yearsInK9: '',
        description: '',
        interests: [],
        photoUrl: '',
        photoFile: null
      });
      setUploadProgress(null);
      onClose();
    } catch (error) {
      console.error('Error submitting profile:', error);
      alert('Failed to submit profile. Please try again.');
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
            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {formData.photoFile && previewUrl ? (
                  <div className="space-y-2">
                    <div className="relative w-40 h-40 mx-auto">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    <p className="text-sm text-gray-600">{formData.photoFile.name}</p>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoFile: null }))}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop an image here, or{' '}
                      <label className="text-blue-500 hover:text-blue-700 cursor-pointer">
                        browse
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-400">Max 5MB, PNG/JPG/GIF</p>
                  </div>
                )}
                
                {uploadProgress !== null && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>
              
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who are you? *
              </label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  validateField('name', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
              <div className="h-6">
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When did you live at K9? *
              </label>
              <input
                type="text"
                value={localYearsInK9}
                onChange={(e) => setLocalYearsInK9(e.target.value)}
                onBlur={(e) => {
                  setFormData(prev => ({ ...prev, yearsInK9: e.target.value }));
                  validateField('yearsInK9', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2020-2021, November 2016 - June 2018, etc."
              />
              <div className="h-6">
                {errors.yearsInK9 && <p className="text-red-500 text-sm mt-1">{errors.yearsInK9}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email so we can stay in touch *
              </label>
              <input
                type="email"
                value={localEmail}
                onChange={(e) => setLocalEmail(e.target.value)}
                onBlur={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  validateField('email', e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
              />
              <div className="h-6">
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
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