import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware here
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'ALL';
    const offset = (page - 1) * limit;

    // Build the query with optimized field selection for table view
    let query = supabase
      .from('College')
      .select('id, name, location, logo, nirfRanking, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add status filter
    if (status !== 'ALL') {
      query = query.eq('status', status === 'ACTIVE');
    }

    // Add search functionality with better performance
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      // Use ilike with index-friendly patterns
      query = query.or(`name.ilike.${searchTerm}%,location.ilike.${searchTerm}%`);
    }

    // Apply pagination
    const { data: colleges, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch colleges data' },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json(
      {
        success: true,
        data: colleges || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
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

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware here
    
    const body = await request.json();
    const {
      name,
      location,
      about,
      courseAndFees,
      hostel,
      placementAndScholarship,
      nirfRanking,
      logo,
      images,
      status = true
    } = body;

    // Validation
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }

    // Insert college
    const { data: college, error } = await supabase
      .from('College')
      .insert([
        {
          name: name.trim(),
          location: location.trim(),
          about: about || null,
          courseAndFees: courseAndFees || null,
          hostel: hostel || null,
          placementAndScholarship: placementAndScholarship || null,
          nirfRanking: nirfRanking ? parseInt(nirfRanking) : null,
          logo: logo || null,
          images: images || null,
          status: status
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create college' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'College created successfully',
        data: college
      },
      { status: 201 }
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
