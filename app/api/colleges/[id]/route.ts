import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware here
    
    const collegeId = parseInt(params.id);

    if (isNaN(collegeId)) {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

    const { data: college, error } = await supabase
      .from('College')
      .select('*')
      .eq('id', collegeId)
      .single();

    if (error || !college) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: college
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware here
    
    const collegeId = parseInt(params.id);

    if (isNaN(collegeId)) {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

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
      status
    } = body;

    // Validation
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }

    // Update college
    const { data: college, error } = await supabase
      .from('College')
      .update({
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
      })
      .eq('id', collegeId)
      .select()
      .single();

    if (error || !college) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update college or college not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'College updated successfully',
        data: college
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication middleware here
    
    const collegeId = parseInt(params.id);

    if (isNaN(collegeId)) {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

    // Delete college
    const { data: college, error } = await supabase
      .from('College')
      .delete()
      .eq('id', collegeId)
      .select()
      .single();

    if (error || !college) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete college or college not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'College deleted successfully'
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
