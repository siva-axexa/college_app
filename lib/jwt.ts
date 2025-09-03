import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export interface TokenPayload {
  userId: number
  phoneNumber: number
}

// Generate JWT token with 20 minute expiration (authToken)
export function generateAuthToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '20m' })
}

export function generateSignUpAuthToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' })
}

// Generate refresh token with 15 day expiration
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15d' })
}

// Legacy function for backwards compatibility
export function generateToken(payload: TokenPayload): string {
  return generateAuthToken(payload)
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET)
    return false
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return true
    }
    return true // Consider invalid tokens as expired
  }
}
