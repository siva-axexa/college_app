import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// Define allowed college course types
const ALLOWED_COLLEGE_COURSES = ['ENGINEERING', 'MEDICAL', 'ARTS', 'LAW'] as const;
type CollegeCourse = typeof ALLOWED_COLLEGE_COURSES[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      authToken,
      firstName,
      lastName,
      email,
      collegeCourse
    } = body;

    // Validate required fields
    if (!authToken) {
      return NextResponse.json(
        { error: 'Auth token is required' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !collegeCourse) {
      return NextResponse.json(
        { error: 'First name, last name, and college course are required' },
        { status: 400 }
      );
    }

    // Validate college course type
    if (!ALLOWED_COLLEGE_COURSES.includes(collegeCourse as CollegeCourse)) {
      return NextResponse.json(
        { 
          error: 'Invalid college course. Allowed values are: ENGINEERING, MEDICAL, ARTS, LAW' 
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Verify JWT auth token
    const tokenPayload = verifyToken(authToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired auth token' },
        { status: 401 }
      );
    }

    const { userId, phoneNumber } = tokenPayload;

    // Find user and verify auth token in database
    const { data: user, error: fetchError } = await supabase
      .from('Student')
      .select('id, phoneNumber, authToken, authTokenExpiresat, signedUp, firstName, lastName')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify phone number matches token
    if (user.phoneNumber !== phoneNumber) {
      return NextResponse.json(
        { error: 'Token phone number mismatch' },
        { status: 401 }
      );
    }

    // Verify stored auth token matches provided auth token
    if (user.authToken !== authToken) {
      return NextResponse.json(
        { error: 'Auth token mismatch' },
        { status: 401 }
      );
    }

    // Check if auth token has expired using timestamp comparison
    const nowTimestamp = Date.now();
    let authTokenExpirationTimestamp;
    
    try {
      // Handle timezone parsing issues by ensuring UTC
      const storedTimestamp = user.authTokenExpiresat;
      const utcTimestamp = storedTimestamp.endsWith('Z') ? storedTimestamp : storedTimestamp + 'Z';
      authTokenExpirationTimestamp = new Date(utcTimestamp).getTime();
    } catch (error) {
      console.error('Error parsing authTokenExpiresat:', user.authTokenExpiresat, error);
      return NextResponse.json(
        { error: 'Invalid auth token timestamp format' },
        { status: 400 }
      );
    }

    if (nowTimestamp > authTokenExpirationTimestamp) {
      // Clear expired auth token
      await supabase
        .from('Student')
        .update({
          authToken: null,
          authTokenExpiresat: new Date().toISOString()
        })
        .eq('id', userId);

      return NextResponse.json(
        { error: 'Auth token has expired. Please refresh your session.' },
        { status: 401 }
      );
    }

    // Check if user is already signed up
    if (user.signedUp) {
      return NextResponse.json(
        { error: 'User account already exists' },
        { status: 400 }
      );
    }

    // Update user record with complete information and mark as signed up
    const { data: updatedUser, error: updateError } = await supabase
      .from('Student')
      .update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email ? email.trim().toLowerCase() : null,
        collegeCourse: collegeCourse as CollegeCourse,
        signedUp: true,
        // Clear the auth token after successful account creation
        authToken: null,
        authTokenExpiresat: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, firstName, lastName, email, phoneNumber, collegeCourse, signedUp')
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    console.log(`Account created successfully for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          collegeCourse: updatedUser.collegeCourse,
          signedUp: updatedUser.signedUp
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
