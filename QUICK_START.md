# 🚀 Token Refresh System - Quick Start Guide

## ✅ Kya Ho Gaya Hai (Backend Complete)

### 1. Database Model Updated
- Staff model mein `refreshToken` field add ho gaya

### 2. Environment Variables Added
```env
JWT_EXPIRES_IN=15m              # Access token 15 minutes
JWT_REFRESH_EXPIRES_IN=7d       # Refresh token 7 days
JWT_REFRESH_SECRET_KEY=refresh-token-secret-key-789
```

### 3. APIs Ready
- ✅ `POST /api/v1/staff/login` - Login (returns both tokens)
- ✅ `POST /api/v1/staff/refresh-token` - Refresh token
- ✅ All protected routes check token expiry

### 4. Middleware Updated
- Auth middleware ab `tokenExpired: true` flag bhejta hai

---

## 🎯 Ab Kya Karna Hai (Frontend)

### Option 1: React/Vue/Angular (Recommended)

**Step 1:** Install axios
```bash
npm install axios
```

**Step 2:** Create `api.js` file
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && 
        error.response?.data?.tokenExpired && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          'http://localhost:5000/api/v1/staff/refresh-token',
          { refreshToken }
        );
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

**Step 3:** Use in components
```javascript
import api from './api';

// Login
const { data } = await api.post('/staff/login', { email, password });
localStorage.setItem('token', data.token);
localStorage.setItem('refreshToken', data.refreshToken);

// Any API call - automatic token refresh
const accounts = await api.get('/account-master');
```

---

### Option 2: Vanilla JavaScript

**Copy paste this code:**
```javascript
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/v1';
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, { ...options, headers });
      const data = await response.json();

      if (response.status === 401 && data.tokenExpired) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(token => {
            options.headers = options.headers || {};
            options.headers.Authorization = `Bearer ${token}`;
            return this.request(endpoint, options);
          });
        }

        this.isRefreshing = true;
        const refreshToken = localStorage.getItem('refreshToken');
        const refreshResponse = await fetch(`${this.baseURL}/staff/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) {
          localStorage.setItem('token', refreshData.token);
          localStorage.setItem('refreshToken', refreshData.refreshToken);
          this.isRefreshing = false;
          return this.request(endpoint, options);
        } else {
          localStorage.clear();
          window.location.href = '/login.html';
        }
      }

      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      throw error;
    }
  }

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
}

const api = new ApiService();
```

---

## 🧪 Testing

### Quick Test:

1. **Start backend:**
```bash
cd new_crm_client_back
npm start
```

2. **Test with curl:**
```bash
# Login
curl -X POST http://localhost:5000/api/v1/staff/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Copy the refreshToken from response

# Refresh token
curl -X POST http://localhost:5000/api/v1/staff/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN_HERE"}'
```

3. **Run test script:**
```bash
node test-token-refresh.js
```

---

## 📁 Files Created

### Documentation:
- ✅ `TOKEN_REFRESH_README.md` - Complete guide (Hindi)
- ✅ `FRONTEND_IMPLEMENTATION.md` - Frontend examples
- ✅ `REACT_COMPLETE_EXAMPLE.js` - React full example
- ✅ `VANILLA_JS_EXAMPLE.html` - HTML/JS example
- ✅ `test-token-refresh.js` - Test script
- ✅ `QUICK_START.md` - This file

### Backend Files Modified:
- ✅ `model/staff.js`
- ✅ `controller/staff.js`
- ✅ `routes/staff.js`
- ✅ `middleware/auth.js`
- ✅ `.env`

---

## 🔥 Key Features

1. **Auto Refresh**: Token automatically refresh hota hai
2. **No Logout**: User ko logout nahi hota
3. **Queue System**: Multiple requests ko handle karta hai
4. **Secure**: Short-lived access tokens
5. **Easy Integration**: Bas interceptor add karo

---

## ⚡ Common Issues

### Issue 1: Token not refreshing
**Solution:** Check if `tokenExpired: true` aa raha hai response mein

### Issue 2: Infinite loop
**Solution:** `_retry` flag check karo interceptor mein

### Issue 3: Multiple refresh calls
**Solution:** Queue system use karo (already implemented)

---

## 🎓 How It Works

```
User Login
    ↓
Get Access Token (15m) + Refresh Token (7d)
    ↓
Save in localStorage
    ↓
Make API Request
    ↓
Token Expired? → YES
    ↓
Interceptor catches 401
    ↓
Call /refresh-token
    ↓
Get new tokens
    ↓
Retry original request
    ↓
Success! ✅
```

---

## 📞 Next Steps

1. ✅ Backend already done
2. 🔄 Copy `api.js` code to your frontend
3. 🔄 Update login to save both tokens
4. 🔄 Use `api` instance for all requests
5. ✅ Done! Auto refresh working

---

## 🎉 That's It!

Ab aapka token refresh system ready hai. User ko kabhi logout nahi hoga jab tak refresh token valid hai (7 days).

**Happy Coding!** 🚀
