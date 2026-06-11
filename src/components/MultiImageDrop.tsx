'use client';

import { useCallback, useRef, useState } from 'react';

interface MultiImageDropProps {
  // Hands every selected/dropped file up to the parent, which is responsible
  // for validation (type/size) and enforcing the max-photo cap.
  onAdd: (files: File[]) => void;
  // How many more photos may be added; <= 0 disables the zone.
  remaining: number;
}

export default function MultiImageDrop({ onAdd, remaining }: MultiImageDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = remaining <= 0;

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onAdd(Array.from(fileList));
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-gray-400 mb-2">
        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {disabled ? (
        <p className="text-sm text-gray-500">You&apos;ve added the maximum number of photos.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-1">
            Drag &amp; drop photos here, or{' '}
            <label className="text-blue-500 hover:text-blue-700 cursor-pointer">
              browse
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  // Reset so re-selecting the same file fires onChange again.
                  if (inputRef.current) inputRef.current.value = '';
                }}
              />
            </label>
          </p>
          <p className="text-xs text-gray-400">
            Up to {remaining} more · max 5&nbsp;MB each · PNG/JPG/GIF
          </p>
        </>
      )}
    </div>
  );
}
