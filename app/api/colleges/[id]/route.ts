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

    // First, get the college data to retrieve file URLs for cleanup
    const { data: college, error: fetchError } = await supabase
      .from('College')
      .select('logo, images')
      .eq('id', collegeId)
      .single();

    if (fetchError || !college) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Delete college from database first
    const { error: deleteError } = await supabase
      .from('College')
      .delete()
      .eq('id', collegeId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete college' },
        { status: 500 }
      );
    }

    // Clean up files from storage (async, don't wait for completion)
    const cleanupFiles = async () => {
      try {
        // Import storage utilities
        const { deleteFile } = await import('@/lib/storage');

        // Delete logo if exists
        if (college.logo && college.logo.includes('supabase.co/storage/v1/object/public/college_logo/')) {
          await deleteFile('college_logo', college.logo);
        }

        // Delete images if exist
        if (college.images && Array.isArray(college.images)) {
          for (const imageUrl of college.images) {
            if (imageUrl && imageUrl.includes('supabase.co/storage/v1/object/public/college_images/')) {
              await deleteFile('college_images', imageUrl);
            }
          }
        }
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
        // Don't fail the request if file cleanup fails
      }
    };

    // Start cleanup but don't wait for it
    cleanupFiles();

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
