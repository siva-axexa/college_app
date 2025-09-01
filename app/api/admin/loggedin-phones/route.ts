import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware here
    
    // Fetch users who have phone numbers but are not signed up yet
    const { data: phones, error } = await supabase
      .from('Student')
      .select('id, phoneNumber, created_at')
      .eq('signedUp', false)
      .not('phoneNumber', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logged-in phones data' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedPhones = phones.map(phone => ({
      id: phone.id,
      phoneNumber: phone.phoneNumber.toString(), // Convert bigint to string
      createdAt: phone.created_at,
      userId: phone.id
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedPhones,
        count: formattedPhones.length
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
      },
      { status: 500 }
    );
  }
}
