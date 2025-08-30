'use client';

import { useState } from 'react';
import BaseModal from '@/components/BaseModal';
import FormField from '@/components/FormField';
import FormButtons from '@/components/FormButtons';
import ImageUpload from '@/components/ImageUpload';

interface TipOfferFormData {
  name: string;
  title: string;
  tipOffer: string;
  link: string;
  imageFile: File | null;
}

interface TipOfferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function TipOfferForm({ isOpen, onClose, onSubmitted }: TipOfferFormProps) {
  const [formData, setFormData] = useState<TipOfferFormData>({
    name: '',
    title: '',
    tipOffer: '',
    link: '',
    imageFile: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.tipOffer.trim()) {
        alert('Please fill in your name and tip/offer description.');
        return;
      }

      // Upload image if provided
      let imageUrl = null;
      let imageAlt = null;
      
      if (formData.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.imageFile);
        
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.url;
          imageAlt = `Image for tip: ${formData.title}`;
        }
      }

      // Process link - convert email to mailto if needed
      let processedLink = formData.link.trim();
      if (processedLink) {
        // Simple email detection regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(processedLink) && !processedLink.startsWith('mailto:')) {
          processedLink = `mailto:${processedLink}`;
        }
      }

      // Submit to API
      const response = await fetch('/api/tips-and-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submitterName: formData.name,
          title: formData.title,
          description: formData.tipOffer,
          externalLink: processedLink,
          imageUrl,
          imageAlt,
          isHoldMyHair: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit tip/offer');
      }

      // Reset form and close
      setFormData({
        name: '',
        title: '',
        tipOffer: '',
        link: '',
        imageFile: null,
      });
      onClose();
      onSubmitted?.(); // Trigger refresh of tips list
      alert('Tip/offer submitted successfully!');
    } catch (error) {
      console.error('Error submitting tip/offer:', error);
      alert(error instanceof Error ? error.message : 'Error submitting tip/offer. Please try again.');
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

        <FormField label="Title">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Give your tip/offer a title"
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

        <FormField label="Link or Email">
          <input
            type="text"
            value={formData.link}
            onChange={(e) => handleInputChange('link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com or your@email.com"
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