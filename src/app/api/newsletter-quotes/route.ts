import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
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

    return NextResponse.json(quotesWithImages);
  } catch (error) {
    console.error('Error fetching newsletter quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter quotes' },
      { status: 500 }
    );
  }
}