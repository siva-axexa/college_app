import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware here
    
    // Fetch users who are signed up with their profile information
    const { data: users, error } = await supabase
      .from('Student')
      .select('id, firstName, lastName, email, collegeCourse, phoneNumber, created_at')
      .eq('signedUp', true)
      .not('firstName', 'is', null)
      .not('lastName', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users data' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedUsers = users.map(user => ({
      id: user.id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      course: user.collegeCourse || '',
      phoneNumber: user.phoneNumber.toString(),
      createdAt: user.created_at
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedUsers,
        count: formattedUsers.length
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
