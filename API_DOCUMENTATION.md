# College Management App - API Documentation

## 📋 Table of Contents
- [Authentication APIs](#authentication-apis)
- [College Management APIs](#college-management-apis)
- [Admin APIs](#admin-apis)
- [Debug/Utility APIs](#debugutility-apis)
- [Error Handling](#error-handling)
- [Data Models](#data-models)

---

## 🔐 Authentication APIs

### 1. Send OTP
**Endpoint:** `POST /api/send-otp`

**Description:** Sends OTP to user's phone number for authentication.

**Request Body:**
```json
{
  "phoneNumber": "9876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Development Mode Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

**Error Response (400/500):**
```json
{
  "error": "Phone number is required"
}
```

---

### 2. Verify OTP
**Endpoint:** `POST /api/verify-otp`

**Description:** Verifies OTP and generates authentication tokens.

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
```json
// Invalid OTP (400)
{
  "error": "Invalid OTP. Please try again."
}

// Expired OTP (400)
{
  "error": "OTP has expired. Please request a new one."
}
```

---

### 3. Create Account
**Endpoint:** `POST /api/create-account`

**Description:** Creates user account after OTP verification.

**Request Body:**
```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "collegeCourse": "ENGINEERING"
}
```

**Allowed College Courses:**
- `ENGINEERING`
- `MEDICAL`
- `ARTS`
- `LAW`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "9876543210",
    "collegeCourse": "ENGINEERING",
    "signedUp": true
  }
}
```

**Error Responses:**
```json
// Invalid token (401)
{
  "error": "Invalid or expired auth token"
}

// Invalid course (400)
{
  "error": "Invalid college course. Allowed: ENGINEERING, MEDICAL, ARTS, LAW"
}
```

---

### 4. Refresh Token
**Endpoint:** `POST /api/refresh-token`

**Description:** Refreshes expired auth token using refresh token.

**Request Body:**
```json
{
  "authToken": "expired_auth_token",
  "refreshToken": "valid_refresh_token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "authToken": "new_auth_token",
  "refreshToken": "same_refresh_token"
}
```

**Error Response (401):**
```json
{
  "error": "Refresh token has expired. Please login again."
}
```

---

## 🏫 College Management APIs

### 1. Get Colleges (List)
**Endpoint:** `GET /api/colleges`

**Description:** Retrieves paginated list of colleges with search and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by college name or location
- `status` (optional): Filter by status (`ALL`, `ACTIVE`, `INACTIVE`)

**Example Request:**
```
GET /api/colleges?page=1&limit=10&search=MIT&status=ACTIVE
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "MIT College of Engineering",
      "location": "Cambridge, MA",
      "logo": "https://example.com/logo.png",
      "nirfRanking": 1,
      "status": true,
      "created_at": "2025-09-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. Create College
**Endpoint:** `POST /api/colleges`

**Description:** Creates a new college entry.

**Request Body:**
```json
{
  "name": "MIT College of Engineering",
  "location": "Cambridge, MA",
  "about": "<p>Premier engineering college with <strong>excellent facilities</strong></p>",
  "courseAndFees": "<ul><li>Computer Science - $50,000/year</li><li>Mechanical Engineering - $45,000/year</li></ul>",
  "hostel": "<p>Modern hostel facilities with AC rooms</p>",
  "placementAndScholarship": "<p>100% placement record with top companies</p>",
  "nirfRanking": 1,
  "logo": "https://example.com/logo.png",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "status": true
}
```

**Required Fields:**
- `name` (string)
- `location` (string)

**Optional Fields:**
- `about` (HTML string)
- `courseAndFees` (HTML string)
- `hostel` (HTML string)
- `placementAndScholarship` (HTML string)
- `nirfRanking` (number)
- `logo` (URL string)
- `images` (array of URL strings)
- `status` (boolean, default: true)

**Success Response (201):**
```json
{
  "success": true,
  "message": "College created successfully",
  "data": {
    "id": 1,
    "name": "MIT College of Engineering",
    "location": "Cambridge, MA",
    "about": "<p>Premier engineering college...</p>",
    "courseAndFees": "<ul><li>Computer Science...</li></ul>",
    "hostel": "<p>Modern hostel facilities...</p>",
    "placementAndScholarship": "<p>100% placement record...</p>",
    "nirfRanking": 1,
    "logo": "https://example.com/logo.png",
    "images": ["https://example.com/image1.jpg"],
    "status": true,
    "created_at": "2025-09-02T10:30:00.000Z"
  }
}
```

---

### 3. Get College by ID
**Endpoint:** `GET /api/colleges/{id}`

**Description:** Retrieves complete college information by ID.

**Example Request:**
```
GET /api/colleges/1
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "MIT College of Engineering",
    "location": "Cambridge, MA",
    "about": "<p>Premier engineering college with <strong>excellent facilities</strong></p>",
    "courseAndFees": "<ul><li>Computer Science - $50,000/year</li></ul>",
    "hostel": "<p>Modern hostel facilities with AC rooms</p>",
    "placementAndScholarship": "<p>100% placement record with top companies</p>",
    "nirfRanking": 1,
    "logo": "https://example.com/logo.png",
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "status": true,
    "created_at": "2025-09-02T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": "College not found"
}
```

---

### 4. Update College
**Endpoint:** `PUT /api/colleges/{id}`

**Description:** Updates existing college information.

**Request Body:** (Same as Create College)
```json
{
  "name": "MIT College of Engineering (Updated)",
  "location": "Cambridge, MA",
  "about": "<p>Updated description...</p>",
  "nirfRanking": 1,
  "status": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "College updated successfully",
  "data": {
    "id": 1,
    "name": "MIT College of Engineering (Updated)",
    // ... other fields
  }
}
```

---

### 5. Delete College
**Endpoint:** `DELETE /api/colleges/{id}`

**Description:** Deletes college and associated files from storage.

**Example Request:**
```
DELETE /api/colleges/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "College deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "College not found"
}
```

---

## 👥 Admin APIs

### 1. Get Logged-in Phones
**Endpoint:** `GET /api/admin/loggedin-phones`

**Description:** Retrieves users who verified phone but haven't completed signup.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by phone number or user ID (numeric only)

**Example Request:**
```
GET /api/admin/loggedin-phones?page=1&limit=10&search=987
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "phoneNumber": "9876543210",
      "createdAt": "2025-09-02T10:30:00.000Z",
      "userId": 6
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 2. Get Users
**Endpoint:** `GET /api/admin/users`

**Description:** Retrieves users who have completed signup.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by first name, last name, or email
- `course` (optional): Filter by course (`ALL`, `ENGINEERING`, `MEDICAL`, `ARTS`, `LAW`)

**Example Request:**
```
GET /api/admin/users?page=1&limit=10&search=john&course=ENGINEERING
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "collegeCourse": "ENGINEERING",
      "phoneNumber": "9876543210",
      "created_at": "2025-09-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔧 Debug/Utility APIs

### 1. Check Twilio Configuration
**Endpoint:** `GET /api/check-twilio`

**Description:** Validates Twilio configuration and credentials.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Twilio configuration is valid",
  "accountSid": "AC***************",
  "serviceId": "VA***************"
}
```

**Error Response (500):**
```json
{
  "error": "Twilio configuration error",
  "details": "Invalid credentials"
}
```

---

## ⚠️ Error Handling

### Common HTTP Status Codes

| Status Code | Description | Example |
|------------|-------------|---------|
| `200` | Success | Request completed successfully |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request body or parameters |
| `401` | Unauthorized | Invalid or expired token |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Server-side error |

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

---

## 📊 Data Models

### Student Model
```typescript
interface Student {
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
```

### College Model
```typescript
interface College {
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
```

### Pagination Model
```typescript
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
```

---

## 🔑 Authentication Flow

1. **Send OTP**: User submits phone number
2. **Verify OTP**: User submits OTP, receives auth & refresh tokens
3. **Create Account**: User completes profile with auth token
4. **Token Refresh**: Use refresh token to get new auth token when expired

### Token Expiration
- **Auth Token**: 20 minutes
- **Refresh Token**: 15 days
- **OTP**: 5 minutes

---

## 📁 File Upload (Supabase Storage)

### Storage Buckets
- **college_logo**: College logo images
- **college_images**: College gallery images

### File Upload Process
1. Upload files to respective buckets
2. Get public URLs
3. Store URLs in database
4. Auto-cleanup on delete/update

### File URL Format
```
https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[filename]
```

---

## 🔄 Environment Configuration

### Required Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SERVICE_ID=your_twilio_verify_service_id

# JWT
JWT_SECRET=your_jwt_secret

# App
NODE_ENV=development|production
```

### Development vs Production
- **Development**: OTP returned in response, no SMS sent
- **Production**: OTP sent via Twilio SMS

---

## 📱 Postman Collection

Import the `postman_collection.json` file into Postman to test all APIs with pre-configured requests and examples.

### Collection Variables
- `baseUrl`: Set to your application URL (default: `http://localhost:3000`)

---

## 📞 Support

For API support or questions:
- Check the error response details
- Verify environment variables
- Ensure database tables exist
- Confirm Supabase storage buckets are created and public

---

*Last Updated: September 2, 2025*
