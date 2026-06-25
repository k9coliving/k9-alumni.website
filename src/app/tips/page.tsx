'use client';

import Layout from '@/components/Layout';
import TipOfferForm from './TipOfferForm';
import TipsList from './TipsList';
import { useState } from 'react';

// Newsletter-aligned design tokens (shared with the landing, who-are-we,
// newsletter, events, and K9 Family pages).
const C = {
  bg: '#FAF6F0',
  ink: '#1B2A41',
  accent: '#E1564D',
  body: '#6F695F',
};
const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';

export default function Tips() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTipSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="min-h-screen" style={{ backgroundColor: C.bg, fontFamily: BODY, color: C.ink }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header !mb-12 flex flex-col items-center">
            <h1
              className="m-0"
              style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(40px,7vw,72px)', lineHeight: 0.98, letterSpacing: '-1px', color: C.ink }}
            >
              Tips &amp; Offers
            </h1>
            <p className="mx-auto mt-5" style={{ fontFamily: BODY, fontSize: 'clamp(15px,1.8vw,18px)', lineHeight: 1.7, color: C.body, maxWidth: 560 }}>
              You post your tip/offering and it will appear on this page. We might add your tip to the upcoming newsletter.
            </p>
          </div>

          {/* Tips listing */}
          <TipsList refreshTrigger={refreshTrigger} />

          {/* Add tip button */}
          <div className="text-center mt-12">
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-7 py-3 rounded-full font-semibold text-white transition-colors hover:brightness-95 cursor-pointer"
              style={{ fontFamily: BODY, background: C.accent }}
            >
              Share a Tip or Offering
            </button>
          </div>
        </div>
      </div>

      {/* Tip/Offer Form Modal */}
      <TipOfferForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitted={handleTipSubmitted}
      />
    </Layout>
  );
}