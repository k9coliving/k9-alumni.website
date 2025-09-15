import { NextRequest, NextResponse } from 'next/server';
import { addResident, getResidentsData } from '@/lib/supabase';
import { requireAuth } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';
import { logger, logApiRequest, logApiError } from '@/lib/logger';

// Helper function to get the full involvement level text
function getInvolvementLevelFull(level: string): string {
  switch (level) {
    case 'full-engagement':
      return "🔊 I want to receive newsletters, be invited to events, be notified of everything";
    case 'newsletter-only':
      return "📮 I just want the newsletter";
    case 'database-only':
      return "🫣 I'm happy to be in the database but I don't want to be contacted";
    case 'team-member':
      return "🚀 I want to join the Alumni Network team!";
    default:
      return "";
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Log incoming request
  logApiRequest(request, {
    endpoint: 'residents',
    operation: 'fetch'
  });

  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) {
    logger.warn('Residents fetch blocked - authentication failed', {
      endpoint: 'residents',
      method: request.method,
      duration: Date.now() - startTime
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    return authResponse;
  }

  try {
    const residents = await getResidentsData();

    // Log successful operation
    logger.info('Residents fetch completed successfully', {
      endpoint: 'residents',
      method: request.method,
      duration: Date.now() - startTime,
      resultCount: residents.length,
    });

    // Add delay before response (per CLAUDE.md guidelines)
    await new Promise(resolve => setTimeout(resolve, 10));

    return NextResponse.json(residents);
  } catch (error) {
    // Enhanced error logging
    logApiError(request, error as Error, {
      endpoint: 'residents',
      operation: 'fetch',
      duration: Date.now() - startTime
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    return NextResponse.json(
      { error: 'Failed to fetch residents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Log incoming request
  logApiRequest(request, {
    endpoint: 'residents',
    operation: 'create'
  });

  // Check authentication first
  const authResponse = await requireAuth(request);
  if (authResponse) {
    logger.warn('Resident creation blocked - authentication failed', {
      endpoint: 'residents',
      method: request.method,
      duration: Date.now() - startTime
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    return authResponse;
  }

  try {
    const body = await request.json();

    // Log profile creation attempt with sanitized data
    logger.info('Resident profile creation attempt', {
      endpoint: 'residents',
      method: request.method,
      hasPhoto: !!body.photo_url,
      involvementLevel: body.involvementLevel,
      currentlyLivingInHouse: body.currentlyLivingInHouse,
      hasInterests: body.interests && body.interests.length > 0,
      yearsInK9: body.years_in_k9
    });

    // Validate required fields
    const requiredFields = ['name', 'email', 'years_in_k9'];
    for (const field of requiredFields) {
      if (!body[field]) {
        // Log validation failure
        logger.warn('Resident creation validation failed - missing required field', {
          endpoint: 'residents',
          method: request.method,
          validationError: `${field} is required`,
          providedFields: Object.keys(body),
          duration: Date.now() - startTime
        });

        await new Promise(resolve => setTimeout(resolve, 10));
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      // Log validation failure
      logger.warn('Resident creation validation failed - invalid email format', {
        endpoint: 'residents',
        method: request.method,
        validationError: 'Invalid email format',
        duration: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare preferences JSONB data
    const preferences: Record<string, string> = {};
    
    if (body.involvementLevel) {
      preferences.involvement_level = body.involvementLevel.trim();
      preferences.involvement_level_full = body.involvementLevel === 'other' 
        ? body.otherInvolvementText?.trim() || ''
        : getInvolvementLevelFull(body.involvementLevel);
      
      if (body.involvementLevel === 'other' && body.otherInvolvementText) {
        preferences.other_involvement_text = body.otherInvolvementText.trim();
      }
    }

    // Add placeholder image if no photo is provided
    if (!body.photo_url) {
      const placeholderImages = [
        'Animals with Balloons.svg',
        'Cat Astronaut Illustration.svg',
        'Cat Pumpkin Illustration.svg',
        'Cat Throwing Vase.svg',
        'Chicken Eating a Worm.svg',
        'Cute Chicken Illustration.svg',
        'Diving with Animals.svg',
        'Dog Paw Illustration.svg',
        'Kiwi Bird Illustration.svg',
        'Octopus Vector Illustration.svg',
        'Penguin Family Illustration.svg',
        'Playful Cat Illustration.svg',
        'cat.svg'
      ];
      const selectedImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
      preferences.placeholder_image = selectedImage;

      // Log placeholder image assignment
      logger.info('Placeholder image assigned to new resident', {
        endpoint: 'residents',
        method: request.method,
        placeholderImage: selectedImage,
        availableImages: placeholderImages.length
      });
    } else {
      // Log photo upload correlation
      logger.info('Photo URL provided for new resident profile', {
        endpoint: 'residents',
        method: request.method,
        hasCustomPhoto: true
      });
    }

    // Prepare data for database insertion
    const newResident = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      location: body.location?.trim() || undefined,
      profession: body.profession?.trim() || undefined,
      years_in_k9: body.years_in_k9,
      interests: body.interests || [],
      description: body.description?.trim() || '',
      photo_url: body.photo_url?.trim() || undefined,
      photo_alt: body.photo_url ? `${body.name} profile photo` : undefined,
      preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
      birthday: body.birthday ? new Date(body.birthday) : undefined,
      currently_living_in_house: body.currentlyLivingInHouse || false
    };

    // Add to database
    const result = await addResident(newResident);

    // Log successful resident creation with enhanced details
    logger.info('Resident profile created successfully', {
      endpoint: 'residents',
      method: request.method,
      duration: Date.now() - startTime,
      residentId: result.id,
      hasPhoto: !!result.photo_url,
      hasPlaceholderImage: !!result.preferences?.placeholder_image,
      involvementLevel: result.preferences?.involvement_level || 'not_specified',
      currentlyLivingInHouse: result.currently_living_in_house || false,
      interestCount: result.interests?.length || 0,
      yearsInK9: result.years_in_k9
    });

    // Log successful resident creation (existing audit log)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logAuditEvent({
      event_type: 'user_added',
      ip_address: ip,
      user_agent: userAgent,
      details: {
        resident_id: result.id,
        resident_name: result.name,
        resident_email: result.email,
        years_in_k9: result.years_in_k9,
        involvement_level: result.preferences?.involvement_level || 'not_specified',
        currently_living_in_house: result.currently_living_in_house || false
      }
    });

    // Add delay before response (per CLAUDE.md guidelines)
    await new Promise(resolve => setTimeout(resolve, 10));

    return NextResponse.json({
      success: true,
      resident: result
    }, { status: 201 });

  } catch (error) {
    // Handle duplicate email error (if we add unique constraint later)
    if (error instanceof Error && error.message.includes('duplicate')) {
      logger.warn('Resident creation failed - duplicate email', {
        endpoint: 'residents',
        method: request.method,
        duration: Date.now() - startTime,
        errorType: 'duplicate_email'
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        { error: 'A profile with this email already exists' },
        { status: 409 }
      );
    }

    // Enhanced error logging
    logApiError(request, error as Error, {
      endpoint: 'residents',
      operation: 'create',
      duration: Date.now() - startTime
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    return NextResponse.json(
      { error: 'Failed to add profile. Please try again.' },
      { status: 500 }
    );
  }
}