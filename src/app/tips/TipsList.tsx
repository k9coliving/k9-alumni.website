'use client';

import { useState, useEffect } from 'react';
import TipCard from './TipCard';
import { PALETTE } from '@/components/newsletter/theme';

const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';

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

interface TipsListProps {
  refreshTrigger?: number;
}

export default function TipsList({ refreshTrigger }: TipsListProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await fetch('/api/tips-and-requests?type=tips');
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
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="text-center py-12" style={{ fontFamily: BODY }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#E1564D' }}></div>
        <p className="mt-4" style={{ color: '#6F695F' }}>Loading tips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" style={{ fontFamily: BODY }}>
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="font-medium hover:underline"
          style={{ color: '#E1564D' }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="text-center py-12" style={{ fontFamily: BODY }}>
        <div className="text-6xl mb-4">💡</div>
        <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif', fontWeight: 400, color: '#1B2A41' }}>No tips yet</h3>
        <p style={{ color: '#6F695F' }}>Be the first to share a tip or offering with the community!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-7">
        {tips.map((tip, index) => (
          <TipCard key={tip.id} tip={tip} palette={PALETTE[index % PALETTE.length]} index={index} />
        ))}
      </div>
    </div>
  );
}