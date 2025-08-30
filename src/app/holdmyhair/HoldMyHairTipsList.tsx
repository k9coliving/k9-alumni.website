'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

interface HoldMyHairCardProps {
  tip: Tip;
}

function HoldMyHairCard({ tip }: HoldMyHairCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex items-start gap-6">
      {/* Support Request Image - only show if exists */}
      {tip.image_url && (
        <div className="flex-shrink-0">
          <div className="bg-gray-100 flex items-center justify-center rounded-lg shadow-lg">
            <Image
              src={tip.image_url}
              alt={tip.image_alt || `Image for ${tip.title}`}
              width={256}
              height={256}
              className="max-w-80 max-h-48 w-auto h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Support Request Details */}
      <div className="flex-1 space-y-4">
        {/* Title and Description */}
        <div className="space-y-1">
          {tip.title && (
            <p className="text-gray-600 leading-relaxed">{tip.title}</p>
          )}
          <p className="text-gray-800 leading-relaxed font-medium">{tip.description}</p>
        </div>
        
        {/* External Link */}
        {tip.external_link && (
          <div>
            <a
              href={tip.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 hover:underline font-medium"
            >
              {(() => {
                const link = tip.external_link;
                // Handle mailto links
                if (link.startsWith('mailto:')) {
                  const email = link.substring(7); // Remove 'mailto:' prefix
                  return email.length > 50 ? email.substring(0, 50) + '...' : email;
                }
                // Handle regular URLs
                return link.length > 50 ? link.substring(0, 50) + '...' : link;
              })()}
            </a>
          </div>
        )}
        
        {/* Signature */}
        <div className="flex justify-end mt-6">
          <div className="text-right">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-400">{formatDate(tip.created_at)}</p>
              <p className="text-3xl font-bold text-gray-900 font-parisienne tracking-wide" style={{ wordSpacing: '0.25em' }}>— {tip.submitter_name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
        <p className="text-gray-600">Be the first to share what you&apos;re going through or offer support to the community!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-8">
        {tips.map((tip, index) => (
          <div key={tip.id}>
            {index > 0 && (
              <div className="flex justify-center mb-8">
                <div className="border-t border-gray-200 w-[70%]"></div>
              </div>
            )}
            <HoldMyHairCard tip={tip} />
          </div>
        ))}
      </div>
    </div>
  );
}