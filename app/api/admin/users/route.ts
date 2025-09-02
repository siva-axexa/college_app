import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware here
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const course = searchParams.get('course') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('Student')
      .select('id, firstName, lastName, email, collegeCourse, phoneNumber, created_at', { count: 'exact' })
      .eq('signedUp', true)
      .not('firstName', 'is', null)
      .not('lastName', 'is', null);

    // Add course filter
    if (course.trim() && course !== 'ALL') {
      query = query.eq('collegeCourse', course.toUpperCase());
    }

    // Add search functionality
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      // Search by firstName, lastName, or email (starts with search term)
      query = query.or(`firstName.ilike.${searchTerm}%,lastName.ilike.${searchTerm}%,email.ilike.${searchTerm}%`);
    }

    // Apply pagination and ordering
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json(
      {
        success: true,
        data: formattedUsers,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          search,
          course
        }
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
