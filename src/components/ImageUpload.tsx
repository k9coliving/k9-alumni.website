'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  placeholder?: string;
  className?: string;
  existingUrl?: string;
}

export default function ImageUpload({
  label,
  value,
  onChange,
  placeholder = "Drag and drop an image here, or",
  className = "",
  existingUrl
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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

    onChange(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  }, [handleFileSelect]);

  // Memoize the preview URL to prevent flickering on re-renders
  const previewUrl = useMemo(() => {
    if (value) {
      return URL.createObjectURL(value);
    }
    return null;
  }, [value]);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
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
        {value && previewUrl ? (
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
            <p className="text-sm text-gray-600">{value.name}</p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : existingUrl ? (
          <div className="space-y-2">
            <div className="relative w-40 h-40 mx-auto">
              <Image
                src={existingUrl}
                alt="Current photo"
                width={160}
                height={160}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <p className="text-sm text-gray-600">Current photo</p>
            <label className="text-blue-500 text-sm hover:text-blue-700 cursor-pointer">
              Change photo
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
          </div>
        ) : (
          <div>
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {placeholder}{' '}
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
  );

  // Export the upload function for use by parent components
  ImageUpload.uploadToSupabase = uploadImageToSupabase;
}

// Static method to upload image to Supabase
ImageUpload.uploadToSupabase = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const { url } = await response.json();
  return url;
};