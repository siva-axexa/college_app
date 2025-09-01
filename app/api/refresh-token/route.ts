import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, generateAuthToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authToken, refreshToken } = body;

    // Validate required fields
    if (!authToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Both auth token and refresh token are required' },
        { status: 400 }
      );
    }

    // Verify the auth token structure (even if expired)
    const authTokenPayload = verifyToken(authToken);
    if (!authTokenPayload) {
      return NextResponse.json(
        { error: 'Invalid auth token format' },
        { status: 401 }
      );
    }

    // Verify the refresh token
    const refreshTokenPayload = verifyToken(refreshToken);
    if (!refreshTokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Ensure both tokens belong to the same user
    if (authTokenPayload.userId !== refreshTokenPayload.userId || 
        authTokenPayload.phoneNumber !== refreshTokenPayload.phoneNumber) {
      return NextResponse.json(
        { error: 'Token mismatch - tokens do not belong to the same user' },
        { status: 401 }
      );
    }

    const { userId, phoneNumber } = refreshTokenPayload;

    // Find user and verify tokens in database
    const { data: user, error: fetchError } = await supabase
      .from('Student')
      .select('id, phoneNumber, authToken, authTokenExpiresat, refreshToken, refreshTokenExpiresat, signedUp')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify phone number matches
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

    // Verify stored refresh token matches provided refresh token
    if (user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token mismatch' },
        { status: 401 }
      );
    }

    // Check if refresh token has expired using timestamp comparison
    const nowTimestamp = Date.now();
    let refreshTokenExpirationTimestamp;
    
    try {
      // Handle timezone parsing issues by ensuring UTC
      const storedTimestamp = user.refreshTokenExpiresat;
      if (!storedTimestamp) {
        return NextResponse.json(
          { error: 'No refresh token expiration found' },
          { status: 400 }
        );
      }
      
      const utcTimestamp = storedTimestamp.endsWith('Z') ? storedTimestamp : storedTimestamp + 'Z';
      refreshTokenExpirationTimestamp = new Date(utcTimestamp).getTime();
    } catch (error) {
      console.error('Error parsing refreshTokenExpiresat:', user.refreshTokenExpiresat, error);
      return NextResponse.json(
        { error: 'Invalid refresh token timestamp format' },
        { status: 400 }
      );
    }

    if (nowTimestamp > refreshTokenExpirationTimestamp) {
      // Clear expired tokens
      await supabase
        .from('Student')
        .update({
          authToken: null,
          authTokenExpiresat: new Date().toISOString(),
          refreshToken: null,
          refreshTokenExpiresat: null
        })
        .eq('id', userId);

      return NextResponse.json(
        { error: 'Refresh token has expired. Please login again.' },
        { status: 401 }
      );
    }

    // Generate new auth token (20 minutes)
    const tokenPayload = {
      userId: user.id,
      phoneNumber: user.phoneNumber
    };
    
    const newAuthToken = generateAuthToken(tokenPayload);
    const newAuthTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // 20 minutes

    // Update user record with new auth token (keep same refresh token)
    const { error: updateError } = await supabase
      .from('Student')
      .update({
        authToken: newAuthToken,
        authTokenExpiresat: newAuthTokenExpiresAt
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to refresh auth token' },
        { status: 500 }
      );
    }

    console.log(`Auth token refreshed successfully for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Auth token refreshed successfully',
        authToken: newAuthToken,
        refreshToken: refreshToken, // Return the same refresh token
        userId: user.id,
        isSignedUp: user.signedUp || false
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
