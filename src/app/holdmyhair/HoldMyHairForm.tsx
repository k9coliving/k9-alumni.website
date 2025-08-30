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
  supportType: string;
  contactMethod: string;
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
    supportType: '',
    contactMethod: '',
    link: '',
    imageFile: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.title.trim() || !formData.story.trim()) {
        alert('Please fill in your name, title, and story.');
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

      // Create description with support type and contact method if provided
      let description = formData.story;
      if (formData.supportType) {
        description += `\n\n**Support Type:** ${formData.supportType}`;
      }
      if (formData.contactMethod) {
        description += `\n**Preferred Contact:** ${formData.contactMethod}`;
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
        supportType: '',
        contactMethod: '',
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

  const supportTypes = [
    'Emotional Support',
    'Practical Help',
    'Professional Guidance',
    'Life Transition Support',
    'Emergency Support',
    'Just need someone to listen',
    'Other'
  ];

  const contactMethods = [
    'Email',
    'Phone call',
    'Text message',
    'Video call',
    'Any method works'
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Your Story"
    >
      <div className="mb-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
        <p className="text-sm text-pink-800">
          💕 Your story matters. Share what you're going through or offer support to others. 
          This is a safe space for our K9 family to hold each other up.
        </p>
      </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter your name"
          />
        </FormField>

        <FormField label="Title" required>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Give your story a title (e.g., 'Need support through job transition')"
          />
        </FormField>

        <FormField label="What's going on?" required>
          <textarea
            required
            value={formData.story}
            onChange={(e) => handleInputChange('story', e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Share as much or as little as you're comfortable with. Whether you need support or want to offer help, we're here for you."
          />
        </FormField>

        <FormField label="What kind of support? (optional)">
          <select
            value={formData.supportType}
            onChange={(e) => handleInputChange('supportType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Select support type...</option>
            {supportTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Preferred contact method (optional)">
          <select
            value={formData.contactMethod}
            onChange={(e) => handleInputChange('contactMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Select contact method...</option>
            {contactMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Contact info or helpful link (optional)">
          <input
            type="text"
            value={formData.link}
            onChange={(e) => handleInputChange('link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="your@email.com or helpful link"
          />
        </FormField>

        <FormButtons
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitText="Share Story"
          submitClass="bg-pink-600 hover:bg-pink-700"
        />
      </form>
    </BaseModal>
  );
}