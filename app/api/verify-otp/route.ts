import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateAuthToken, generateRefreshToken } from '@/lib/jwt';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const serviceId = process.env.TWILIO_SERVICE_ID!;

if (!accountSid || !authToken || !serviceId) {
  throw new Error('Missing Twilio environment variables');
}

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
    }

    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : '+' + phoneNumber.replace(/\D/g, '');

    const phoneNumberDigits = parseInt(formattedPhone.replace(/\D/g, ''));
    const otpNumber = parseInt(otp);

    if (isNaN(phoneNumberDigits) || isNaN(otpNumber)) {
      return NextResponse.json({ error: 'Invalid phone number or OTP format' }, { status: 400 });
    }

    let user: any; // ✅ Declare user variable outside if/else

    // ✅ Development Mode: Verify OTP from Supabase
    if (process.env.NODE_ENV === 'development') {
      const { data, error } = await supabase
        .from('Student')
        .select('id, phoneNumber, otp, otpExpiresAt, signedUp, isVerifiedUser')
        .eq('phoneNumber', phoneNumberDigits)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (data.otp !== otpNumber) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      const now = Date.now();
      const expiry = new Date(data.otpExpiresAt).getTime();

      if (now > expiry) {
        return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
      }

      user = data; // ✅ Assign the user data
    } else {
      // ✅ Production Mode: Use Twilio Verify API
      const verificationCheck = await client.verify.v2.services(serviceId)
        .verificationChecks
        .create({
          to: formattedPhone,
          code: otp,
        });
        console.log("verificationCheck", verificationCheck)
      if (verificationCheck.status !== 'approved') {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
      }

      // ✅ Lookup the user in DB
      const { data, error } = await supabase
        .from('Student')
        .select('id, phoneNumber, signedUp, isVerifiedUser')
        .eq('phoneNumber', phoneNumberDigits)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      user = data; // ✅ Assign the user data
    }

    // ✅ Token Generation (shared)
    const tokenPayload = {
      userId: user.id,
      phoneNumber: user.phoneNumber
    };

    const authToken = generateAuthToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const authTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const refreshTokenExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('Student')
      .update({
        authToken,
        authTokenExpiresat: authTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresat: refreshTokenExpiresAt,
        otp: null,
        otpExpiresAt: null,
        isVerifiedUser: true,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      authToken,
      refreshToken,
      userId: user.id,
      isSignedUp: user.signedUp || false
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
      },
      { status: 500 }
    );
  }
}
