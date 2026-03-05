'use client';

import { useState } from 'react';
import BaseModal from '@/components/BaseModal';
import FormField from '@/components/FormField';
import FormButtons from '@/components/FormButtons';
import ImageUpload from '@/components/ImageUpload';

interface HoldMyHairFormData {
  name: string;
  title: string;
  story: string;
  link: string;
  imageFile: File | null;
}

interface HoldMyHairFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function HoldMyHairForm({ isOpen, onClose, onSubmitted }: HoldMyHairFormProps) {
  const [formData, setFormData] = useState<HoldMyHairFormData>({
    name: '',
    title: '',
    story: '',
    link: '',
    imageFile: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const missingFields = [];
      if (!formData.name.trim()) missingFields.push('name');
      if (!formData.title.trim()) missingFields.push('what\'s going on');
      if (!formData.story.trim()) missingFields.push('how we can help');

      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
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
          imageAlt = `Image for: ${formData.title}`;
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

      // Use story as description
      const description = formData.story;

      // Submit to API
      const response = await fetch('/api/tips-and-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submitterName: formData.name,
          title: formData.title,
          description: description,
          externalLink: processedLink,
          imageUrl,
          imageAlt,
          isHoldMyHair: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit story');
      }

      // Reset form and close
      setFormData({
        name: '',
        title: '',
        story: '',
        link: '',
        imageFile: null,
      });
      onClose();
      onSubmitted?.(); // Trigger refresh of tips list
      alert('Your story has been shared with the community. Thank you for being brave. 💕');
    } catch (error) {
      console.error('Error submitting story:', error);
      alert(error instanceof Error ? error.message : 'Error sharing your story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof HoldMyHairFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Hold my hair"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Image (optional)">
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
            className="form-input"
            placeholder="Enter your name"
          />
        </FormField>

        <FormField label="What's going on?" required>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="form-input"
            placeholder=""
          />
        </FormField>

        <FormField label="How can we help?" required>
          <textarea
            required
            value={formData.story}
            onChange={(e) => handleInputChange('story', e.target.value)}
            rows={3}
            className="form-input"
            placeholder=""
          />
        </FormField>


        <FormField label="Contact info or helpful link (optional)">
          <input
            type="text"
            value={formData.link}
            onChange={(e) => handleInputChange('link', e.target.value)}
            className="form-input"
            placeholder="your@email.com or helpful link"
          />
        </FormField>

        <FormButtons
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitText="Submit"
        />
      </form>
    </BaseModal>
  );
}