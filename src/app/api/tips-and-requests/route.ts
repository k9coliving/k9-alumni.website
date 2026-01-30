import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) {
    logger.warn('Tips fetch blocked - authentication failed', {
      endpoint: 'tips-and-requests',
      method: 'GET'
    });
    return authResponse;
  }

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
      logger.error('Failed to fetch tips and requests', {
        endpoint: 'tips-and-requests',
        method: 'GET',
        error: error.message,
        duration: Date.now() - startTime
      });
      return NextResponse.json({ error: 'Failed to fetch tips and requests' }, { status: 500 });
    }

    logger.info('Tips fetch completed successfully', {
      endpoint: 'tips-and-requests',
      method: 'GET',
      type: type || 'all',
      resultCount: data?.length || 0,
      duration: Date.now() - startTime
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Tips fetch failed with exception', {
      endpoint: 'tips-and-requests',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) {
    logger.warn('Tip creation blocked - authentication failed', {
      endpoint: 'tips-and-requests',
      method: 'POST'
    });
    return authResponse;
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.submitterName || !body.title || !body.description) {
      logger.warn('Tip creation validation failed - missing required fields', {
        endpoint: 'tips-and-requests',
        method: 'POST',
        hasSubmitterName: !!body.submitterName,
        hasTitle: !!body.title,
        hasDescription: !!body.description
      });
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
      logger.error('Failed to create tip/request', {
        endpoint: 'tips-and-requests',
        method: 'POST',
        error: error.message,
        duration: Date.now() - startTime
      });
      return NextResponse.json({ error: 'Failed to create tip/request' }, { status: 500 });
    }

    logger.info('Tip/request created successfully', {
      endpoint: 'tips-and-requests',
      method: 'POST',
      itemId: data[0]?.id,
      isHoldMyHair: data[0]?.is_hold_my_hair,
      duration: Date.now() - startTime
    });

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
    logger.error('Tip creation failed with exception', {
      endpoint: 'tips-and-requests',
      method: 'POST',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}