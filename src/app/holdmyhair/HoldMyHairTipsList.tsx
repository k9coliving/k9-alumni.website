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
  priority: number;
  created_at: string;
}

interface HoldMyHairTipsListProps {
  refreshTrigger?: number;
}

export default function HoldMyHairTipsList({ refreshTrigger }: HoldMyHairTipsListProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await fetch('/api/tips-and-requests?type=holdmyhair');
        if (!response.ok) {
          throw new Error('Failed to fetch tips');
        }
        const data = await response.json();
        setTips(data);
      } catch (error) {
        console.error('Error fetching Hold My Hair tips:', error);
        setError('Failed to load support requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading support requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-pink-600 hover:text-pink-800 font-medium hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💕</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No support requests yet</h3>
        <p className="text-gray-600">Be the first to share what you're going through or offer support to the community!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {tips.map((tip, index) => (
          <div key={tip.id}>
            {index > 0 && (
              <div className="flex justify-center mb-8">
                <div className="border-t border-gray-200 w-[70%]"></div>
              </div>
            )}
            <TipCard tip={tip} hideHoldMyHairBadge={true} />
          </div>
        ))}
      </div>
    </div>
  );
}