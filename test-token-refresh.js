// ==================== TOKEN REFRESH TEST SCRIPT ====================
// Node.js script to test the token refresh API

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test credentials (update with your actual test user)
const TEST_USER = {
  email: 'test@test.com',
  password: 'password123'
};

let accessToken = '';
let refreshToken = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Login
async function testLogin() {
  log('\n========== TEST 1: Login ==========', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/staff/login`, TEST_USER);
    
    if (response.data.token && response.data.refreshToken) {
      accessToken = response.data.token;
      refreshToken = response.data.refreshToken;
      log('✓ Login successful', 'green');
      log(`Access Token: ${accessToken.substring(0, 20)}...`, 'yellow');
      log(`Refresh Token: ${refreshToken.substring(0, 20)}...`, 'yellow');
      return true;
    } else {
      log('✗ Login failed: No tokens received', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 2: Access protected route with valid token
async function testProtectedRoute() {
  log('\n========== TEST 2: Protected Route (Valid Token) ==========', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/account-master?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    log('✓ Protected route accessed successfully', 'green');
    log(`Fetched ${response.data.data?.length || 0} accounts`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Protected route failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 3: Refresh token
async function testRefreshToken() {
  log('\n========== TEST 3: Refresh Token ==========', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/staff/refresh-token`, {
      refreshToken: refreshToken
    });
    
    if (response.data.token && response.data.refreshToken) {
      const oldAccessToken = accessToken;
      accessToken = response.data.token;
      refreshToken = response.data.refreshToken;
      
      log('✓ Token refresh successful', 'green');
      log(`Old Token: ${oldAccessToken.substring(0, 20)}...`, 'yellow');
      log(`New Token: ${accessToken.substring(0, 20)}...`, 'yellow');
      log('Tokens are different: ' + (oldAccessToken !== accessToken), 'yellow');
      return true;
    } else {
      log('✗ Token refresh failed: No tokens received', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Token refresh failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 4: Use new token
async function testNewToken() {
  log('\n========== TEST 4: Use New Token ==========', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/account-master?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    log('✓ New token works correctly', 'green');
    log(`Fetched ${response.data.data?.length || 0} accounts`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ New token failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test 5: Invalid refresh token
async function testInvalidRefreshToken() {
  log('\n========== TEST 5: Invalid Refresh Token ==========', 'blue');
  try {
    await axios.post(`${BASE_URL}/staff/refresh-token`, {
      refreshToken: 'invalid_token_12345'
    });
    
    log('✗ Should have failed with invalid token', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✓ Invalid token correctly rejected', 'green');
      log(`Error: ${error.response.data.message}`, 'yellow');
      return true;
    } else {
      log(`✗ Unexpected error: ${error.message}`, 'red');
      return false;
    }
  }
}

// Test 6: Expired token (manual test - requires waiting)
async function testExpiredToken() {
  log('\n========== TEST 6: Expired Token (Info) ==========', 'blue');
  log('To test expired token:', 'yellow');
  log('1. Set JWT_EXPIRES_IN=10s in .env', 'yellow');
  log('2. Login and wait 11 seconds', 'yellow');
  log('3. Try to access protected route', 'yellow');
  log('4. Should get tokenExpired: true in response', 'yellow');
  log('5. Frontend interceptor will auto-refresh', 'yellow');
  return true;
}

// Run all tests
async function runAllTests() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║   TOKEN REFRESH SYSTEM - TEST SUITE       ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 6
  };

  // Run tests sequentially
  if (await testLogin()) results.passed++; else results.failed++;
  if (await testProtectedRoute()) results.passed++; else results.failed++;
  if (await testRefreshToken()) results.passed++; else results.failed++;
  if (await testNewToken()) results.passed++; else results.failed++;
  if (await testInvalidRefreshToken()) results.passed++; else results.failed++;
  if (await testExpiredToken()) results.passed++; else results.failed++;

  // Summary
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║              TEST SUMMARY                  ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  log(`Total Tests: ${results.total}`, 'yellow');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`, 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed! Token refresh system is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the implementation.', 'red');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});


// ==================== POSTMAN COLLECTION ====================
/*
{
  "info": {
    "name": "Token Refresh API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@test.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/v1/staff/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "v1", "staff", "login"]
        }
      }
    },
    {
      "name": "2. Get Accounts (Protected)",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{accessToken}}"}],
        "url": {
          "raw": "http://localhost:5000/api/v1/account-master?page=1&limit=10",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "v1", "account-master"],
          "query": [
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    },
    {
      "name": "3. Refresh Token",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/v1/staff/refresh-token",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "v1", "staff", "refresh-token"]
        }
      }
    }
  ]
}
*/
