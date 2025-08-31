import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let query = supabase
      .from('tips_and_requests')
      .select('*');

    // Filter based on type parameter
    if (type === 'holdmyhair') {
      query = query.eq('is_hold_my_hair', true);
    } else if (type === 'tips') {
      query = query.eq('is_hold_my_hair', false);
    }
    // If no type specified, return all (for backward compatibility)

    const { data, error } = await query
      .order('priority', { ascending: false })
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
  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) return authResponse;

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

    // Log successful tip/request creation
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const createdItem = data[0];
    await logAuditEvent({
      event_type: 'data_modified',
      ip_address: ip,
      user_agent: userAgent,
      details: {
        action: createdItem.is_hold_my_hair ? 'create_hold_my_hair_request' : 'create_tip',
        item_id: createdItem.id,
        title: createdItem.title,
        submitter_name: createdItem.submitter_name,
        is_hold_my_hair: createdItem.is_hold_my_hair,
        has_external_link: !!createdItem.external_link,
        has_image: !!createdItem.image_url
      }
    });

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}