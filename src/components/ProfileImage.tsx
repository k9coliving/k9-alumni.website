'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProfileImageProps {
  src?: string;
  alt: string;
  name: string;
  size?: number;
}

export default function ProfileImage({ src, alt, name, size = 48 }: ProfileImageProps) {
  const [imageError, setImageError] = useState(false);
  
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  // If no src or image error, show initials
  if (!src || imageError) {
    return (
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg"
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="rounded-full overflow-hidden" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        unoptimized // Bypass Next.js optimization for external URLs
      />
    </div>
  );
}