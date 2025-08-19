import { NextResponse } from 'next/server';
import { getResidentsData } from '@/lib/supabase';

export async function GET() {
  try {
    const residents = await getResidentsData();
    
    return NextResponse.json({
      success: true,
      count: residents.length,
      data: residents.slice(0, 3) // Return first 3 records for testing
    });
  } catch (error) {
    console.error('Supabase test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}