'use client';

import { useState, useCallback } from 'react';
import BaseModal from './BaseModal';
import FormButtons from './FormButtons';
import ImageUpload from './ImageUpload';

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
  involvementLevel: string;
  otherInvolvementText: string;
  birthday: Date | null;
  currentlyLivingInHouse: boolean;
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
    photoFile: null,
    involvementLevel: 'full-engagement',
    otherInvolvementText: '',
    birthday: null,
    currentlyLivingInHouse: false
  });

  // Local state for input values to prevent re-renders
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [localYearsInK9, setLocalYearsInK9] = useState('');
  const [localInterests, setLocalInterests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});


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
        finalPhotoUrl = await ImageUpload.uploadToSupabase(formData.photoFile);
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
        photoFile: null,
        involvementLevel: 'full-engagement',
        otherInvolvementText: '',
        birthday: null,
        currentlyLivingInHouse: false
      });
      setLocalName('');
      setLocalEmail('');
      setLocalYearsInK9('');
      setLocalInterests('');
      onClose();
    } catch (error) {
      console.error('Error submitting profile:', error);
      alert('Failed to submit profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tell us who you are"
      maxWidth="2xl"
    >
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Let&apos;s take care of each other beyond the walls of K9.
        </p>
        <p className="text-sm text-gray-600 mt-3">
          This information will be accessible to other K9 alumni and current residents. Only share what you are comfortable sharing 😊
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
            {/* Photo Upload Section */}
            <ImageUpload
              label="Profile Photo"
              value={formData.photoFile}
              onChange={(file) => setFormData(prev => ({ ...prev, photoFile: file, photoUrl: file ? '' : prev.photoUrl }))}
            />

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
                value={localInterests}
                onChange={(e) => setLocalInterests(e.target.value)}
                onBlur={(e) => {
                  const interests = e.target.value.split(',').map(interest => interest.trim()).filter(Boolean);
                  setFormData(prev => ({ ...prev, interests }));
                }}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How involved do you want to be in the network?
              </label>
              <select
                value={formData.involvementLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, involvementLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full-engagement">Notify me of everything</option>
                <option value="newsletter-only">Newsletter</option>
                <option value="database-only">Just join</option>
                <option value="team-member">Alumni Network Team</option>
                <option value="other">Other</option>
              </select>
              
              {/* Disclaimer based on selection */}
              {formData.involvementLevel && formData.involvementLevel !== 'other' && (
                <p className="text-base text-gray-600 mt-2">
                  {formData.involvementLevel === 'full-engagement' && 
                    "🔊 I want to receive newsletters, be invited to events, be notified of everything"}
                  {formData.involvementLevel === 'newsletter-only' && 
                    "📮 I just want the newsletter"}
                  {formData.involvementLevel === 'database-only' && 
                    "🫣 I'm happy to be in the database but I don't want to be contacted"}
                  {formData.involvementLevel === 'team-member' && 
                    "🚀 I want to join the Alumni Network team!"}
                </p>
              )}
              
              {/* Other input field when "Other" is selected */}
              {formData.involvementLevel === 'other' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    You picked Other. What do you have in mind?
                  </label>
                  <input
                    type="text"
                    value={formData.otherInvolvementText}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherInvolvementText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us what you have in mind..."
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When is your birthday?
              </label>
              <input
                type="date"
                value={formData.birthday ? formData.birthday.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  birthday: e.target.value ? new Date(e.target.value) : null 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
                placeholder="Select your birthday"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Do you currently live in the house?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, currentlyLivingInHouse: false }))}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    !formData.currentlyLivingInHouse
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  No, I&apos;m an alumni
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, currentlyLivingInHouse: true }))}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    formData.currentlyLivingInHouse
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Yes, I live in the house
                </button>
              </div>
            </div>
        </div>

        <FormButtons
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitText="Add Profile"
        />
      </form>
    </BaseModal>
  );
}