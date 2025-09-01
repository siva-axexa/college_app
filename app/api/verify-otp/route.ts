import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateAuthToken, generateRefreshToken } from '@/lib/jwt';
import twilio from 'twilio';

// Initialize Twilio client for verification
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;
const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otp } = body;

    // Validate required fields
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Remove non-digit characters from phone number for database lookup
    const phoneNumberDigits = parseInt(phoneNumber.replace(/\D/g, ''));
    const otpNumber = parseInt(otp);

    if (isNaN(phoneNumberDigits) || isNaN(otpNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number or OTP format' },
        { status: 400 }
      );
    }

    // Find user with matching phone number
    const { data: user, error: fetchError } = await supabase
      .from('Student')
      .select('id, phoneNumber, otp, otpExpiresAt, signedUp, isVerifiedUser')
      .eq('phoneNumber', phoneNumberDigits)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.otp || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: 'No OTP found for this phone number' },
        { status: 400 }
      );
    }

    // Check if OTP has expired using timestamp comparison to avoid timezone issues
    const nowTimestamp = Date.now();
    
    // Parse stored timestamp more carefully
    let otpExpirationTimestamp;
    try {
      // Handle timezone parsing issues by ensuring UTC
      const storedTimestamp = user.otpExpiresAt;
      // If timestamp doesn't end with Z, it might not be properly UTC
      const utcTimestamp = storedTimestamp.endsWith('Z') ? storedTimestamp : storedTimestamp + 'Z';
      otpExpirationTimestamp = new Date(utcTimestamp).getTime();
    } catch (error) {
      console.error('Error parsing otpExpiresAt:', user.otpExpiresAt, error);
      return NextResponse.json(
        { error: 'Invalid OTP timestamp format' },
        { status: 400 }
      );
    }
    
    
    if (nowTimestamp > otpExpirationTimestamp) {
      await supabase
        .from('Student')
        .update({
          otp: null,
          otpExpiresAt: null
        })
        .eq('id', user.id);
        
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp !== otpNumber) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Generate auth token (20 min) and refresh token (15 days)
    const tokenPayload = {
      userId: user.id,
      phoneNumber: user.phoneNumber
    };
    
    const authToken = generateAuthToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const authTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // 20 minutes
    const refreshTokenExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days

    // Update user record with tokens, clear OTP, and mark as verified
    const { error: updateError } = await supabase
      .from('Student')
      .update({
        authToken: authToken,
        authTokenExpiresat: authTokenExpiresAt,
        refreshToken: refreshToken,
        refreshTokenExpiresat: refreshTokenExpiresAt,
        otp: null,
        otpExpiresAt: null,
        isVerifiedUser: true // Mark user as verified when OTP is successfully verified
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate session token' },
        { status: 500 }
      );
    }


    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        authToken: authToken,
        refreshToken: refreshToken,
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
