import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { supabase } from "@/lib/supabase";

// Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const serviceId = process.env.TWILIO_SERVICE_ID!;

if (!accountSid || !authToken || !serviceId) {
  console.error("Missing Twilio environment variables");
}

const client = twilio(accountSid, authToken);

// Format phone number to E.164
function formatPhoneNumber(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  if (!phoneNumber.startsWith("+")) {
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    return `+${digitsOnly}`;
  }

  return phoneNumber;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const formattedToNumber = formatPhoneNumber(phoneNumber);

    if (process.env.NODE_ENV === "development") {
      // Simulate OTP sending in development mode
      const fakeOtp = Math.floor(100000 + Math.random() * 900000);

      console.log(`Development mode: Generated OTP for ${formattedToNumber}: ${fakeOtp}`);

      return NextResponse.json({
        success: true,
        message: "OTP generated successfully (Development mode)",
        otp: fakeOtp,
      });
    } else {
      // Production: Use Twilio Verify Service
      try {
        const verification = await client.verify.v2.services(serviceId)
          .verifications
          .create({
            to: formattedToNumber,
            channel: "sms",
          });

        console.log(`OTP sent via Twilio. Status: ${verification.status}, SID: ${verification.sid}`);

        return NextResponse.json({
          success: true,
          message: "OTP sent successfully",
        });
      } catch (twilioVerifyError: any) {
        console.error("Twilio Verify error:", {
          message: twilioVerifyError.message,
          code: twilioVerifyError.code,
          status: twilioVerifyError.status,
          moreInfo: twilioVerifyError.moreInfo,
        });

        return NextResponse.json(
          {
            error: "Failed to send OTP via Twilio",
            details:
              process.env.NODE_ENV !== "production"
                ? twilioVerifyError.message
                : "SMS service error",
            ...(process.env.NODE_ENV !== "production" && {
              debugInfo: {
                code: twilioVerifyError.code,
                moreInfo: twilioVerifyError.moreInfo,
              },
            }),
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again later",
      },
      { status: 500 }
    );
  }
}
