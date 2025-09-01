import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/lib/supabase';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;

if (!accountSid || !authToken || !serviceId) {
  console.error('Missing Twilio environment variables');
}

const client = twilio(accountSid, authToken);

// Function to generate 6-digit OTP
function generateOTP(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

// Function to format phone number to E.164 format
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it doesn't start with +, add it
  if (!phoneNumber.startsWith('+')) {
    // If it's a US number and doesn't have country code, add +1
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    // If it already has country code, just add +
    return `+${digitsOnly}`;
  }
  
  return phoneNumber;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!accountSid || !authToken || !serviceId) {
      return NextResponse.json(
        { error: 'Twilio configuration is missing. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Format phone number to E.164 format
    const formattedToNumber = formatPhoneNumber(phoneNumber);

    // Generate 6-digit OTP
    const otp = generateOTP();
    
    // Generate OTP expiration time (5 minutes from now) - store as UTC timestamp
    const expirationTimestamp = Date.now() + 5 * 60 * 1000;
    const otpExpiresAt = new Date(expirationTimestamp).toISOString();
    

    
    // Remove non-digit characters from phone number for storage
    const phoneNumberDigits = parseInt(formattedToNumber.replace(/\D/g, ''));

    try {
      // First, check if user already exists with this phone number
      const { data: existingUser, error: fetchError } = await supabase
        .from('Student')
        .select('id, phoneNumber')
        .eq('phoneNumber', phoneNumberDigits)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Database fetch error:', fetchError);
        return NextResponse.json(
          { error: 'Database error while checking user' },
          { status: 500 }
        );
      }

      let studentId: number;

      if (existingUser) {
        // Update existing user's OTP
        const { error: updateError } = await supabase
          .from('Student')
          .update({
            otp: otp,
            otpExpiresAt: otpExpiresAt
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('Database update error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update OTP in database' },
            { status: 500 }
          );
        }
        
        studentId = existingUser.id;
      } else {
        // Create new user record with OTP
        const { data: newUser, error: insertError } = await supabase
          .from('Student')
          .insert({
            phoneNumber: phoneNumberDigits,
            otp: otp,
            otpExpiresAt: otpExpiresAt,
            collegeCourse: '', // Will be filled later
            authTokenExpiresat: new Date().toISOString(),
            signedUp: false
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Database insert error:', insertError);
          return NextResponse.json(
            { error: 'Failed to save OTP to database' },
            { status: 500 }
          );
        }
        
        studentId = newUser.id;
      }

             // Handle development vs production mode
       if (process.env.NODE_ENV === 'development') {
         // Development mode: Don't send SMS, just return OTP
         console.log(`Development mode: OTP generated for User ID: ${studentId}, OTP: ${otp}`);
         
         return NextResponse.json(
           {
             success: true,
             message: 'OTP generated successfully (Development mode)',
             otp: otp // Include OTP in development mode
           },
           { status: 200 }
         );
       } else {
         // Production mode: Send OTP via Twilio Verify Service
         try {
           const verification = await client.verify.v2.services(serviceId)
             .verifications
             .create({
               to: formattedToNumber,
               channel: 'sms'
              //  Remove customCode - let Twilio generate the OTP
             });

           console.log(`OTP sent successfully via Twilio Verify. Status: ${verification.status}, SID: ${verification.sid}, User ID: ${studentId}`);

           return NextResponse.json(
             {
               success: true,
               message: 'OTP sent successfully'
             },
             { status: 200 }
           );
         } catch (twilioVerifyError: any) {
           console.error('Twilio Verify error:', {
             message: twilioVerifyError.message,
             code: twilioVerifyError.code,
             status: twilioVerifyError.status,
             moreInfo: twilioVerifyError.moreInfo,
             toNumber: formattedToNumber,
           });
           
           return NextResponse.json(
             {
               error: 'Failed to send OTP via Verify Service',
               details: process.env.NODE_ENV !== 'production' ? twilioVerifyError.message : 'SMS service error',
               ...(process.env.NODE_ENV !== 'production' && {
                 debugInfo: {
                   code: twilioVerifyError.code,
                   toNumber: formattedToNumber,
                   moreInfo: twilioVerifyError.moreInfo,
                 }
               }),
             },
             { status: 500 }
           );
         }
       }
    } catch (databaseError: any) {
      console.error('Database error:', databaseError);
      return NextResponse.json(
        {
          error: 'Failed to save OTP to database',
          details: process.env.NODE_ENV === 'development' ? databaseError.message : 'Database error',
        },
        { status: 500 }
      );
    }
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
