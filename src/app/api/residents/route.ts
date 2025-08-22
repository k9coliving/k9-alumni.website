import { NextRequest, NextResponse } from 'next/server';
import { addResident } from '@/lib/supabase';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'years_in_k9'];
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
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare preferences JSONB data
    const preferences: any = {};
    
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
      preferences.placeholder_image = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
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

    return NextResponse.json({
      success: true,
      resident: result
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding resident:', error);
    
    // Handle duplicate email error (if we add unique constraint later)
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A profile with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add profile. Please try again.' },
      { status: 500 }
    );
  }
}