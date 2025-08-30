'use client';

import { useState, useEffect } from 'react';
import TipCard from './TipCard';

interface Tip {
  id: string;
  submitter_name: string;
  title: string;
  description: string;
  external_link?: string;
  image_url?: string;
  image_alt?: string;
  is_hold_my_hair: boolean;
  created_at: string;
}

export default function TipsList() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await fetch('/api/tips-and-requests');
        if (!response.ok) {
          throw new Error('Failed to fetch tips');
        }
        const data = await response.json();
        setTips(data);
      } catch (error) {
        console.error('Error fetching tips:', error);
        setError('Failed to load tips. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading tips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💡</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tips yet</h3>
        <p className="text-gray-600">Be the first to share a tip or offering with the community!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tips.map((tip) => (
        <TipCard key={tip.id} tip={tip} />
      ))}
    </div>
  );
}