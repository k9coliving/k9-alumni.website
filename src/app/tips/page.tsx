'use client';

import Layout from '@/components/Layout';
import TipOfferForm from '@/components/TipOfferForm';
import TipsList from '@/components/TipsList';
import { useState } from 'react';

export default function Tips() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTipSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="min-h-screen relative" style={{
        background: `
          radial-gradient(circle at 10px 10px, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
        `,
        backgroundColor: '#f9fafb',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header">
            <h1 className="page-header-title">
              Tips & Offerings
            </h1>
            <div className="page-header-divider"></div>
            <p className="page-header-subtitle">
              You post your tip/offering and it will appear on this page. We might add your tip to the upcoming newsletter.
            </p>
          </div>

          {/* Tips listing */}
          <TipsList refreshTrigger={refreshTrigger} />

          {/* Add tip button */}
          <div className="text-center mt-12">
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg cursor-pointer"
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