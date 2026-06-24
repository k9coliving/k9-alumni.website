'use client';

import Image from 'next/image';

interface JoinCallToActionProps {
  onAddProfileClick: () => void;
  isSubmitting?: boolean;
}

// Newsletter-aligned design tokens (shared with the landing + K9 Family pages).
const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';

export default function JoinCallToAction({ onAddProfileClick, isSubmitting = false }: JoinCallToActionProps) {
  return (
    <div
      className="p-8 rounded-[20px] flex flex-col sm:flex-row items-center justify-center gap-6"
      style={{ background: '#FBF7F1', border: '1px solid #ECE3D5', boxShadow: '0 1px 2px rgba(40,30,20,.03)' }}
    >
      <div className="text-center">
        <h2 className="text-3xl mb-3" style={{ fontFamily: SERIF, fontWeight: 400, color: '#1B2A41' }}>
          Excited about this?
        </h2>
        <p className="mb-6 mx-auto" style={{ fontFamily: BODY, color: '#6F695F', maxWidth: 440, lineHeight: 1.6 }}>
          Join our alumni database to connect with fellow K9ers and help grow our community network.
        </p>
        <button
          onClick={onAddProfileClick}
          className="px-7 py-3 rounded-full font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:brightness-95"
          style={{ fontFamily: BODY, background: '#E1564D' }}
          disabled={isSubmitting}
        >
          Add Your Profile
        </button>
      </div>
      <Image src="/house.png" alt="" width={160} height={160} className="block flex-none h-32 w-auto" />
    </div>
  );
}