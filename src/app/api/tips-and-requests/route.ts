import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tips_and_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tips and requests:', error);
      return NextResponse.json({ error: 'Failed to fetch tips and requests' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.submitterName || !body.title || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: submitterName, title, and description are required' },
        { status: 400 }
      );
    }

    // Prepare the data for insertion
    const insertData = {
      submitter_name: body.submitterName.trim(),
      title: body.title.trim(),
      description: body.description.trim(),
      external_link: body.externalLink?.trim() || null,
      image_url: body.imageUrl || null,
      image_alt: body.imageAlt || null,
      is_hold_my_hair: body.isHoldMyHair || false
    };

    const { data, error } = await supabase
      .from('tips_and_requests')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Error creating tip/request:', error);
      return NextResponse.json({ error: 'Failed to create tip/request' }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}