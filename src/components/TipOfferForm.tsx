'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';
import FormField from './FormField';
import FormButtons from './FormButtons';
import ImageUpload from './ImageUpload';

interface TipOfferFormData {
  name: string;
  tipOffer: string;
  link: string;
  imageFile: File | null;
}

interface TipOfferFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TipOfferForm({ isOpen, onClose }: TipOfferFormProps) {
  const [formData, setFormData] = useState<TipOfferFormData>({
    name: '',
    tipOffer: '',
    link: '',
    imageFile: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement API call to submit tip/offer
      console.log('Tip/Offer submitted:', formData);
      
      // Reset form and close
      setFormData({
        name: '',
        tipOffer: '',
        link: '',
        imageFile: null,
      });
      onClose();
      alert('Tip/offer submitted successfully!');
    } catch (error) {
      console.error('Error submitting tip/offer:', error);
      alert('Error submitting tip/offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof TipOfferFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Your Tip or Offering"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Image">
          <ImageUpload
            label=""
            value={formData.imageFile}
            onChange={(file) => setFormData(prev => ({ ...prev, imageFile: file }))}
          />
        </FormField>

        <FormField label="Your Name" required>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </FormField>

        <FormField label="What is your tip/offer?" required>
          <textarea
            required
            value={formData.tipOffer}
            onChange={(e) => handleInputChange('tipOffer', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your tip or what you're offering..."
          />
        </FormField>

        <FormField label="Does it have a link?">
          <input
            type="url"
            value={formData.link}
            onChange={(e) => handleInputChange('link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </FormField>

        <FormButtons
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitText="Submit Tip/Offer"
        />
      </form>
    </BaseModal>
  );
}