import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromPhoneNumber) {
  console.error('Missing Twilio environment variables');
}

const client = twilio(accountSid, authToken);

// Function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    if (!accountSid || !authToken || !fromPhoneNumber) {
      return NextResponse.json(
        { error: 'Twilio configuration is missing. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Format phone numbers to E.164 format
    const formattedToNumber = formatPhoneNumber(phoneNumber);
    const formattedFromNumber = formatPhoneNumber(fromPhoneNumber);

    // Debug logging
    console.log('Original from number:', fromPhoneNumber);
    console.log('Formatted from number:', formattedFromNumber);
    console.log('Original to number:', phoneNumber);
    console.log('Formatted to number:', formattedToNumber);

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Create message body
    const messageBody = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;

    try {
      // Send SMS using Twilio
      const message = await client.messages.create({
        body: messageBody,
        from: formattedFromNumber,
        to: formattedToNumber,
      });

      console.log(`OTP sent successfully. Message SID: ${message.sid}`);

      // Return success response (don't include OTP in production for security)
      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent successfully',
          messageSid: message.sid,
          // Only include OTP in development for testing purposes
          ...(process.env.NODE_ENV === 'development' && { otp }),
        },
        { status: 200 }
      );
    } catch (twilioError: any) {
      console.error('Twilio error details:', {
        message: twilioError.message,
        code: twilioError.code,
        status: twilioError.status,
        moreInfo: twilioError.moreInfo,
        fromNumber: formattedFromNumber,
        toNumber: formattedToNumber,
      });
      
      return NextResponse.json(
        {
          error: 'Failed to send OTP',
          details: process.env.NODE_ENV === 'development' ? twilioError.message : 'SMS service error',
          ...(process.env.NODE_ENV === 'development' && {
            debugInfo: {
              code: twilioError.code,
              fromNumber: formattedFromNumber,
              toNumber: formattedToNumber,
              moreInfo: twilioError.moreInfo,
            }
          }),
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
