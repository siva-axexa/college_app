import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for TypeScript
export interface Student {
  id: number
  email: string | null
  collegeCourse: string
  firstName: string | null
  lastName: string | null
  phoneNumber: number
  dateOfBirth: string | null
  gender: string | null
  created_at: string
  otp: number | null
  authToken: string | null
  otpExpiresAt: string | null
  authTokenExpiresat: string
  signedUp: boolean | null
  refreshToken: string | null
  refreshTokenExpiresat: string | null
  isVerifiedUser: boolean | null
}

export interface College {
  id: number
  logo: string | null
  images: string[] | null
  name: string | null
  location: string | null
  about: string | null
  courseAndFees: string | null
  hostel: string | null
  placementAndScholarship: string | null
  created_at: string
  nirfRanking: number | null
  status: boolean | null
}
