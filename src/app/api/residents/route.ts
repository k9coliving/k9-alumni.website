import { NextRequest, NextResponse } from 'next/server';
import { addResident } from '@/lib/supabase';

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
      photo_alt: body.photo_url ? `${body.name} profile photo` : undefined
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