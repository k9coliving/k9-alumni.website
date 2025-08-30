'use client';

import Layout from '@/components/Layout';
import TipOfferForm from '@/components/TipOfferForm';
import { useState } from 'react';

export default function Tips() {
  const [isFormOpen, setIsFormOpen] = useState(false);
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

          {/* Coming soon placeholder */}
          <div className="text-center py-20">
            <div className="text-8xl mb-8">💡</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              We're working on building a comprehensive tips and offerings platform where alumni 
              can share advice, resources, and help each other navigate post-K9 life.
            </p>
            
            {/* Submit tip/offer button */}
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
      />
    </Layout>
  );
}