import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) {
    logger.warn('Newsletter quotes fetch blocked - authentication failed', {
      endpoint: 'newsletter-quotes',
      method: 'GET'
    });
    return authResponse;
  }

  try {
    const { data: quotes, error } = await supabase
      .from('newsletter_quotes')
      .select(`
        *,
        residents (
          photo_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to include fallback image logic
    const quotesWithImages = quotes?.map(quote => ({
      ...quote,
      effective_image_url: quote.image_url || quote.residents?.photo_url || null
    }));

    logger.info('Newsletter quotes fetch completed successfully', {
      endpoint: 'newsletter-quotes',
      method: 'GET',
      resultCount: quotesWithImages?.length || 0,
      duration: Date.now() - startTime
    });

    return NextResponse.json(quotesWithImages);
  } catch (error) {
    logger.error('Failed to fetch newsletter quotes', {
      endpoint: 'newsletter-quotes',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    return NextResponse.json(
      { error: 'Failed to fetch newsletter quotes' },
      { status: 500 }
    );
  }
}