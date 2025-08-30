'use client';

import Layout from '@/components/Layout';
import HoldMyHairForm from '@/components/HoldMyHairForm';
import HoldMyHairTipsList from '@/components/HoldMyHairTipsList';
import { useState } from 'react';

export default function HoldMyHair() {
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
              Hold My Hair
            </h1>
            <div className="page-header-divider"></div>
            <p className="page-header-subtitle">
              You post your tip/offering and it will appear on this page. We will also review it to see if we can match it with another alumni's set of skills and we will add it to the upcoming newsletter.
            </p>
          </div>


          {/* Tips listing */}
          <HoldMyHairTipsList refreshTrigger={refreshTrigger} />

          {/* Action buttons */}
          <div className="flex justify-center gap-4 mt-12">
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary px-6 py-3"
            >
              Share Your Story
            </button>
          </div>

        </div>
      </div>

      {/* Hold My Hair Form Modal */}
      <HoldMyHairForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitted={handleTipSubmitted}
      />
    </Layout>
  );
}