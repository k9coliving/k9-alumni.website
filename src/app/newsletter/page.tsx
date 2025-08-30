'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Image from 'next/image';
import NewsletterCallToAction from '@/components/NewsletterCallToAction';

interface NewsletterQuote {
  id: string;
  resident_uuid: string | null;
  name: string;
  image_url: string | null;
  effective_image_url: string | null;
  quote: string;
  created_at: string;
  updated_at: string;
  residents?: {
    photo_url: string | null;
  };
}

export default function Newsletter() {
  const [quotes, setQuotes] = useState<NewsletterQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/newsletter-quotes');
        if (response.ok) {
          const data = await response.json();
          setQuotes(data);
        }
      } catch (error) {
        console.error('Error fetching newsletter quotes:', error);
      } finally {
        setQuotesLoading(false);
      }
    };

    fetchQuotes();
  }, []);
  const recentIssues = [
    {
      title: "Summer Alumni Updates",
      date: "July 2024",
      preview: "Catch up on summer events, new alumni spotlights, and upcoming gatherings across the country...",
      topics: ["Events", "Alumni Spotlights", "Summer Gatherings"]
    },
    {
      title: "Career Moves & Celebrations",
      date: "June 2024",
      preview: "Celebrating recent promotions, job changes, and professional achievements in our community...",
      topics: ["Career Updates", "Achievements", "Professional Network"]
    },
    {
      title: "Relocation Wave",
      date: "May 2024",
      preview: "So many alumni are on the move! Find out who&apos;s relocating where and how to connect...",
      topics: ["Relocations", "City Updates", "Housing"]
    }
  ];

  const newsletterFeatures = [
    {
      icon: "📰",
      title: "Alumni Spotlights",
      description: "Get to know fellow alumni through featured profiles and their post-K9 journeys"
    },
    {
      icon: "🎉",
      title: "Event Updates",
      description: "Stay informed about upcoming gatherings, reunions, and local meetups"
    },
    {
      icon: "💼",
      title: "Career News",
      description: "Celebrate promotions, job changes, and professional achievements"
    },
    {
      icon: "🏠",
      title: "Housing Board",
      description: "Latest housing opportunities, roommate searches, and relocation updates"
    },
    {
      icon: "💡",
      title: "Tips & Advice",
      description: "Featured tips from alumni and practical advice for post-K9 life"
    },
    {
      icon: "📅",
      title: "Community Calendar",
      description: "Important dates, deadlines, and opportunities you won&apos;t want to miss"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen relative" style={{
        background: `
          radial-gradient(circle at 10px 10px, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
        `,
        backgroundColor: '#f9fafb',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-20">
            <h1 className="text-6xl sm:text-7xl font-extrabold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'serif' }}>
              Newsletter
            </h1>
            <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-8"></div>
            <div className="max-w-4xl mx-auto text-left space-y-4">
              <p className="text-lg text-gray-500 font-light leading-relaxed">
                Remember those late-night kitchen conversations and weekend catch-ups that made K9 feel like home? Our quarterly newsletter brings that same energy to your inbox, sharing the adventures, milestones, and everyday moments of our extended K9 family.
              </p>
              <p className="text-lg text-gray-500 font-light leading-relaxed">
                We'll give you a heads-up a week before each newsletter goes out, so you can share whatever feels right—big news, small wins, or just letting everyone know where life has taken you lately. Both alumni and current residents are welcome to share, and we'll add you to the list when you join the resident list on The K9 Family. Staying connected should feel as natural as it did when we all lived under the same roof. ❤️
              </p>
            </div>
          </div>

          {/* Newsletter Quotes Section */}
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-8">
              Letters from the past
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-16"></div>
            
            {quotesLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading community updates...</p>
              </div>
            ) : quotes.length > 0 ? (
              <div className="space-y-16">
                {quotes.map((quote, index) => {
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div key={quote.id}>
                      <div className={`flex items-start gap-12 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                          <div className="w-48 bg-gray-100 flex items-center justify-center rounded-lg shadow-lg">
                            {quote.effective_image_url ? (
                              <Image
                                src={quote.effective_image_url}
                                alt={`${quote.name} profile photo`}
                                width={192}
                                height={192}
                                className="w-48 h-auto object-contain rounded-lg"
                              />
                            ) : (
                              <div className="w-48 h-48 bg-gray-50 flex items-center justify-center rounded-lg">
                                <Image
                                  src="/missing/cat.svg"
                                  alt="Profile placeholder illustration"
                                  width={128}
                                  height={128}
                                  className="w-32 h-32"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quote Content */}
                        <div className="flex-1 space-y-6">
                          <div>
                            <p className="text-gray-700 text-lg leading-relaxed italic mb-4">
                              "{quote.quote}"
                            </p>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-gray-900 font-parisienne tracking-wide" style={{ wordSpacing: '0.25em' }}>
                                — {quote.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Show call-to-action after first quote */}
                      {index === 0 && (
                        <NewsletterCallToAction className="mt-16 mb-8" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No community updates yet.</p>
              </div>
            )}
            
            {/* Show call-to-action after all quotes */}
            {!quotesLoading && quotes.length > 1 && (
              <NewsletterCallToAction className="mt-16" />
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}