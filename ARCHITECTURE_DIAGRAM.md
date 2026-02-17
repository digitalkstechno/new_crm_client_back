# 🎨 Token Refresh System - Visual Architecture

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER LOGIN FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

    User                    Frontend                Backend              Database
     │                         │                       │                    │
     │  Enter Credentials      │                       │                    │
     ├────────────────────────>│                       │                    │
     │                         │  POST /staff/login    │                    │
     │                         ├──────────────────────>│                    │
     │                         │                       │  Verify User       │
     │                         │                       ├───────────────────>│
     │                         │                       │<───────────────────┤
     │                         │                       │  User Found        │
     │                         │                       │                    │
     │                         │                       │  Generate Tokens:  │
     │                         │                       │  - Access (15m)    │
     │                         │                       │  - Refresh (7d)    │
     │                         │                       │                    │
     │                         │                       │  Save Refresh      │
     │                         │                       ├───────────────────>│
     │                         │                       │<───────────────────┤
     │                         │  Response:            │                    │
     │                         │  {                    │                    │
     │                         │    token: "xxx",      │                    │
     │                         │    refreshToken: "yyy"│                    │
     │                         │  }                    │                    │
     │                         │<──────────────────────┤                    │
     │                         │                       │                    │
     │                         │  Save to localStorage │                    │
     │                         │  - token              │                    │
     │                         │  - refreshToken       │                    │
     │  Redirect to Dashboard  │                       │                    │
     │<────────────────────────┤                       │                    │
     │                         │                       │                    │


┌─────────────────────────────────────────────────────────────────────┐
│                    NORMAL API REQUEST FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

    User                    Frontend                Backend              Database
     │                         │                       │                    │
     │  Click "View Accounts"  │                       │                    │
     ├────────────────────────>│                       │                    │
     │                         │                       │                    │
     │                         │  Interceptor:         │                    │
     │                         │  Add Authorization    │                    │
     │                         │  Header               │                    │
     │                         │                       │                    │
     │                         │  GET /account-master  │                    │
     │                         │  Header: Bearer token │                    │
     │                         ├──────────────────────>│                    │
     │                         │                       │  Verify Token      │
     │                         │                       │  ✓ Valid           │
     │                         │                       │                    │
     │                         │                       │  Fetch Data        │
     │                         │                       ├───────────────────>│
     │                         │                       │<───────────────────┤
     │                         │  Response: { data }   │                    │
     │                         │<──────────────────────┤                    │
     │  Display Accounts       │                       │                    │
     │<────────────────────────┤                       │                    │
     │                         │                       │                    │


┌─────────────────────────────────────────────────────────────────────┐
│                  TOKEN EXPIRED - AUTO REFRESH FLOW                   │
└─────────────────────────────────────────────────────────────────────┘

    User                    Frontend                Backend              Database
     │                         │                       │                    │
     │  Click "View Accounts"  │                       │                    │
     ├────────────────────────>│                       │                    │
     │                         │                       │                    │
     │                         │  GET /account-master  │                    │
     │                         │  Header: Bearer token │                    │
     │                         ├──────────────────────>│                    │
     │                         │                       │  Verify Token      │
     │                         │                       │  ✗ EXPIRED!        │
     │                         │  401 Unauthorized     │                    │
     │                         │  {                    │                    │
     │                         │    tokenExpired: true │                    │
     │                         │  }                    │                    │
     │                         │<──────────────────────┤                    │
     │                         │                       │                    │
     │                         │  ⚡ INTERCEPTOR       │                    │
     │                         │  Catches Error        │                    │
     │                         │                       │                    │
     │                         │  POST /refresh-token  │                    │
     │                         │  {                    │                    │
     │                         │    refreshToken: "yyy"│                    │
     │                         │  }                    │                    │
     │                         ├──────────────────────>│                    │
     │                         │                       │  Verify Refresh    │
     │                         │                       ├───────────────────>│
     │                         │                       │<───────────────────┤
     │                         │                       │  ✓ Valid           │
     │                         │                       │                    │
     │                         │                       │  Generate New:     │
     │                         │                       │  - Access Token    │
     │                         │                       │  - Refresh Token   │
     │                         │                       │                    │
     │                         │                       │  Update DB         │
     │                         │                       ├───────────────────>│
     │                         │  Response:            │                    │
     │                         │  {                    │                    │
     │                         │    token: "new_xxx",  │                    │
     │                         │    refreshToken: "new"│                    │
     │                         │  }                    │                    │
     │                         │<──────────────────────┤                    │
     │                         │                       │                    │
     │                         │  Update localStorage  │                    │
     │                         │                       │                    │
     │                         │  🔄 RETRY ORIGINAL    │                    │
     │                         │  GET /account-master  │                    │
     │                         │  Header: Bearer new   │                    │
     │                         ├──────────────────────>│                    │
     │                         │                       │  ✓ Valid Token     │
     │                         │                       │  Fetch Data        │
     │                         │                       ├───────────────────>│
     │                         │  Response: { data }   │                    │
     │                         │<──────────────────────┤                    │
     │  Display Accounts       │                       │                    │
     │<────────────────────────┤                       │                    │
     │  (User didn't notice!)  │                       │                    │
     │                         │                       │                    │


┌─────────────────────────────────────────────────────────────────────┐
│              MULTIPLE REQUESTS - QUEUE SYSTEM                        │
└─────────────────────────────────────────────────────────────────────┘

    Request 1               Request 2               Request 3           Backend
        │                       │                       │                   │
        │  GET /accounts        │                       │                   │
        ├──────────────────────────────────────────────────────────────────>│
        │                       │  GET /leads           │                   │
        │                       ├──────────────────────────────────────────>│
        │                       │                       │  GET /staff       │
        │                       │                       ├──────────────────>│
        │  401 (expired)        │                       │                   │
        │<──────────────────────────────────────────────────────────────────┤
        │                       │  401 (expired)        │                   │
        │                       │<──────────────────────────────────────────┤
        │                       │                       │  401 (expired)    │
        │                       │                       │<──────────────────┤
        │                       │                       │                   │
        │  🔄 Start Refresh     │                       │                   │
        │  (isRefreshing=true)  │                       │                   │
        │                       │                       │                   │
        │                       │  ⏸️ Add to Queue      │                   │
        │                       │                       │                   │
        │                       │                       │  ⏸️ Add to Queue  │
        │                       │                       │                   │
        │  POST /refresh-token  │                       │                   │
        ├──────────────────────────────────────────────────────────────────>│
        │  New Tokens           │                       │                   │
        │<──────────────────────────────────────────────────────────────────┤
        │                       │                       │                   │
        │  ✅ Process Queue     │                       │                   │
        │  Resolve All Promises │                       │                   │
        │                       │                       │                   │
        │  Retry Request 1      │                       │                   │
        ├──────────────────────────────────────────────────────────────────>│
        │                       │  Retry Request 2      │                   │
        │                       ├──────────────────────────────────────────>│
        │                       │                       │  Retry Request 3  │
        │                       │                       ├──────────────────>│
        │  Success              │                       │                   │
        │<──────────────────────────────────────────────────────────────────┤
        │                       │  Success              │                   │
        │                       │<──────────────────────────────────────────┤
        │                       │                       │  Success          │
        │                       │                       │<──────────────────┤


┌─────────────────────────────────────────────────────────────────────┐
│                    REFRESH TOKEN EXPIRED                             │
└─────────────────────────────────────────────────────────────────────┘

    User                    Frontend                Backend              Database
     │                         │                       │                    │
     │  (After 7 days)         │                       │                    │
     │  Click "View Accounts"  │                       │                    │
     ├────────────────────────>│                       │                    │
     │                         │  GET /account-master  │                    │
     │                         ├──────────────────────>│                    │
     │                         │  401 (expired)        │                    │
     │                         │<──────────────────────┤                    │
     │                         │                       │                    │
     │                         │  POST /refresh-token  │                    │
     │                         ├──────────────────────>│                    │
     │                         │                       │  Verify Refresh    │
     │                         │                       │  ✗ EXPIRED!        │
     │                         │  401 Unauthorized     │                    │
     │                         │<──────────────────────┤                    │
     │                         │                       │                    │
     │                         │  Clear localStorage   │                    │
     │                         │  Redirect to /login   │                    │
     │  Login Page             │                       │                    │
     │<────────────────────────┤                       │                    │
     │  (User needs to login)  │                       │                    │
     │                         │                       │                    │
```

## 🏗️ Architecture Components

### 1. **Tokens**
```
Access Token (JWT)
├── Payload: { id: userId }
├── Secret: JWT_SECRET_KEY
├── Expiry: 15 minutes
└── Usage: API authentication

Refresh Token (JWT)
├── Payload: { id: userId }
├── Secret: JWT_REFRESH_SECRET_KEY
├── Expiry: 7 days
├── Storage: Database (staff.refreshToken)
└── Usage: Get new access token
```

### 2. **Interceptor Logic**
```
Request Interceptor
└── Add Authorization header with token

Response Interceptor
├── Success (200-299)
│   └── Return response
│
└── Error (401)
    ├── Check tokenExpired flag
    │   └── YES
    │       ├── Check if already refreshing
    │       │   ├── YES → Add to queue
    │       │   └── NO → Start refresh
    │       │
    │       ├── Call /refresh-token
    │       │   ├── Success
    │       │   │   ├── Update tokens
    │       │   │   ├── Process queue
    │       │   │   └── Retry original request
    │       │   │
    │       │   └── Failure
    │       │       ├── Clear storage
    │       │       └── Redirect to login
    │       │
    │       └── Return response
    │
    └── Other errors → Reject
```

### 3. **Database Schema**
```javascript
Staff Model
├── fullName: String
├── email: String (unique)
├── phone: String (unique)
├── password: String (encrypted)
├── role: ObjectId (ref: Role)
├── refreshToken: String ⭐ NEW
├── isDeleted: Boolean
└── timestamps: true
```

### 4. **API Endpoints**
```
POST /api/v1/staff/login
├── Input: { email, password }
├── Process:
│   ├── Verify credentials
│   ├── Generate access token (15m)
│   ├── Generate refresh token (7d)
│   └── Save refresh token to DB
└── Output: { token, refreshToken, data }

POST /api/v1/staff/refresh-token
├── Input: { refreshToken }
├── Process:
│   ├── Verify refresh token
│   ├── Check against DB
│   ├── Generate new access token
│   ├── Generate new refresh token
│   └── Update DB
└── Output: { token, refreshToken }

GET /api/v1/* (Protected Routes)
├── Middleware: authMiddleware
├── Process:
│   ├── Extract token from header
│   ├── Verify token
│   │   ├── Valid → Continue
│   │   └── Expired → Return 401 + tokenExpired flag
│   └── Attach user to request
└── Output: Protected resource
```

## 📈 Performance Metrics

```
Token Size:
├── Access Token: ~200 bytes
└── Refresh Token: ~200 bytes

Request Overhead:
├── Normal Request: 0ms (token in header)
├── Expired + Refresh: ~100-200ms (one-time)
└── Queued Requests: 0ms (wait for refresh)

Security:
├── Access Token Exposure Window: 15 minutes
├── Refresh Token Validity: 7 days
└── Token Rotation: Every refresh
```

## 🎯 Benefits Summary

```
✅ Security
   ├── Short-lived access tokens
   ├── Refresh token rotation
   └── Database validation

✅ User Experience
   ├── No sudden logouts
   ├── Seamless token refresh
   └── Background processing

✅ Performance
   ├── Queue system for multiple requests
   ├── Single refresh for all pending requests
   └── Minimal overhead

✅ Scalability
   ├── Stateless access tokens
   ├── Database-backed refresh tokens
   └── Easy to implement across services
```

---

**Yeh complete visual architecture hai aapke token refresh system ka!** 🎨
