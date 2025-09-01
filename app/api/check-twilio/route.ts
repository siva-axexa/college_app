import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhoneNumber) {
      return NextResponse.json(
        { 
          error: 'Missing Twilio environment variables',
          missing: {
            accountSid: !accountSid,
            authToken: !authToken,
            phoneNumber: !fromPhoneNumber,
          }
        },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    try {
      // Get account information
      const account = await client.api.accounts(accountSid).fetch();
      
      // Get phone numbers
      const phoneNumbers = await client.incomingPhoneNumbers.list();
      
      // Find your specific phone number
      const yourNumber = phoneNumbers.find(num => num.phoneNumber === fromPhoneNumber);
      
      return NextResponse.json({
        account: {
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type,
        },
        configuredNumber: fromPhoneNumber,
        numberExists: !!yourNumber,
        numberDetails: yourNumber ? {
          phoneNumber: yourNumber.phoneNumber,
          friendlyName: yourNumber.friendlyName,
          capabilities: yourNumber.capabilities,
          smsEnabled: yourNumber.capabilities?.sms,
          voiceEnabled: yourNumber.capabilities?.voice,
          mmsEnabled: yourNumber.capabilities?.mms,
        } : null,
        totalNumbers: phoneNumbers.length,
        allNumbers: phoneNumbers.map(num => ({
          phoneNumber: num.phoneNumber,
          friendlyName: num.friendlyName,
          capabilities: num.capabilities,
        })),
      });
    } catch (twilioError: any) {
      return NextResponse.json(
        {
          error: 'Twilio API error',
          details: twilioError.message,
          code: twilioError.code,
          configuredNumber: fromPhoneNumber,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
