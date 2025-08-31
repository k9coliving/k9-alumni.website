import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) return authResponse;

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('start_datetime', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching custom events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'organizerName', 'organizerEmail', 'eventTitle', 'eventDescription',
      'eventLocation', 'startDateTime', 'duration'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.organizerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate start date/time
    const startDate = new Date(body.startDateTime);
    
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date format' },
        { status: 400 }
      );
    }

    // Validate duration is provided
    if (!body.duration || !body.duration.trim()) {
      return NextResponse.json(
        { error: 'Event duration is required' },
        { status: 400 }
      );
    }

    // Validate URLs if provided
    const urlFields = ['infoLink', 'visualUrl'];
    for (const field of urlFields) {
      if (body[field] && !body[field].match(/^https?:\/\/.+/)) {
        return NextResponse.json(
          { error: `${field} must be a valid URL starting with http:// or https://` },
          { status: 400 }
        );
      }
    }

    // Prepare data for database insertion
    const eventData = {
      organizer_name: body.organizerName.trim(),
      organizer_email: body.organizerEmail.trim().toLowerCase(),
      title: body.eventTitle.trim(),
      description: body.eventDescription.trim(),
      location: body.eventLocation.trim(),
      start_datetime: startDate.toISOString(),
      duration: body.duration.trim(),
      info_link: body.infoLink?.trim() || null,
      visual_url: body.visualUrl?.trim() || null,
      additional_notes: body.additionalNotes?.trim() || null
    };

    // Insert into database
    const { data: event, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log successful event creation
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logAuditEvent({
      event_type: 'data_modified',
      ip_address: ip,
      user_agent: userAgent,
      details: {
        action: 'create_event',
        event_id: event.id,
        event_title: event.title,
        organizer_name: event.organizer_name,
        organizer_email: event.organizer_email,
        event_location: event.location,
        start_datetime: event.start_datetime,
        duration: event.duration
      }
    });

    return NextResponse.json({
      success: true,
      event: event
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding custom event:', error);
    
    return NextResponse.json(
      { error: 'Failed to create event. Please try again.' },
      { status: 500 }
    );
  }
}