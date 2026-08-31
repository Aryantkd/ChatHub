/**
 * API Integration Tests
 * Run: npm test  (requires server running: npm run dev)
 * Or:  node --test tests/api.test.js
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const TIMEOUT = 10000;

// Shared state across tests
let accessToken = '';
let refreshTokenValue = '';
let userId = '';
let testEmail = `test_${Date.now()}@example.com`;

const req = async (method, path, body = null, token = null) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    return { status: res.status, body: await res.json() };
  } finally {
    clearTimeout(timer);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────────────────
describe('Health', () => {
  test('GET / - server is alive', async () => {
    const res = await fetch('http://localhost:5000/');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Session / Auth
// ─────────────────────────────────────────────────────────────────────────────
describe('Session', () => {
  test('POST /session/register - validation error (no body)', async () => {
    const { status, body } = await req('POST', '/session/register', {});
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  test('POST /session/register - creates new user', async () => {
    const { status, body } = await req('POST', '/session/register', {
      email: testEmail,
      password: 'SecurePass123',
      displayName: 'Test User',
    });
    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken, 'accessToken missing');
    assert.ok(body.data.refreshToken, 'refreshToken missing');
    assert.ok(body.data.user._id, 'user._id missing');
    accessToken = body.data.accessToken;
    refreshTokenValue = body.data.refreshToken;
    userId = body.data.user._id;
  });

  test('POST /session/register - duplicate email returns 409', async () => {
    const { status, body } = await req('POST', '/session/register', {
      email: testEmail,
      password: 'AnotherPass123',
      displayName: 'Duplicate User',
    });
    assert.equal(status, 409);
    assert.equal(body.success, false);
  });

  test('POST /session/login - wrong password returns 401', async () => {
    const { status, body } = await req('POST', '/session/login', {
      email: testEmail,
      password: 'WrongPassword',
    });
    assert.equal(status, 401);
    assert.equal(body.success, false);
  });

  test('POST /session/login - valid credentials', async () => {
    const { status, body } = await req('POST', '/session/login', {
      email: testEmail,
      password: 'SecurePass123',
    });
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);
    accessToken = body.data.accessToken;
    refreshTokenValue = body.data.refreshToken;
  });

  test('POST /session/refresh-token - invalid token returns 401', async () => {
    const { status, body } = await req('POST', '/session/refresh-token', {
      refreshToken: 'totally_invalid_token',
    });
    assert.equal(status, 401);
    assert.equal(body.success, false);
  });

  test('POST /session/forgot-password - always returns 200', async () => {
    const { status, body } = await req('POST', '/session/forgot-password', {
      email: 'any@example.com',
    });
    assert.equal(status, 200);
    assert.equal(body.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────
describe('User', () => {
  test('GET /user/profile - no token returns 401', async () => {
    const { status } = await req('GET', '/user/profile');
    assert.equal(status, 401);
  });

  test('GET /user/profile - returns authenticated user', async () => {
    const { status, body } = await req('GET', '/user/profile', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data._id, userId);
  });

  test('PUT /user/profile - updates profile fields', async () => {
    const { status, body } = await req('PUT', '/user/profile', {
      bio: 'Hello from test',
      age: 25,
      gender: 'male',
    }, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.bio, 'Hello from test');
  });

  test('PUT /user/profile - validation error for invalid age', async () => {
    const { status, body } = await req('PUT', '/user/profile', {
      age: 10,
    }, accessToken);
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  test(`GET /user/:userId - returns user by id`, async () => {
    const { status, body } = await req('GET', `/user/${userId}`);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data._id, userId);
  });

  test(`GET /user/:userId - unknown id returns 404`, async () => {
    const { status, body } = await req('GET', '/user/000000000000000000000000');
    assert.equal(status, 404);
    assert.equal(body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────
describe('Notifications', () => {
  test('GET /notification - returns empty list', async () => {
    const { status, body } = await req('GET', '/notification', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.notifications));
    assert.equal(body.data.unreadCount, 0);
  });

  test('PUT /notification/:id/read - unknown id returns 404', async () => {
    const { status } = await req('PUT', '/notification/000000000000000000000000/read', null, accessToken);
    assert.equal(status, 404);
  });

  test('DELETE /notification/:id - unknown id returns 404', async () => {
    const { status } = await req('DELETE', '/notification/000000000000000000000000', null, accessToken);
    assert.equal(status, 404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interest Rooms (public)
// ─────────────────────────────────────────────────────────────────────────────
describe('Interest Rooms', () => {
  test('GET /interestRoom/active - public, returns array', async () => {
    const { status, body } = await req('GET', '/interestRoom/active');
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  test('POST /interestRoom - requires admin role', async () => {
    const { status, body } = await req('POST', '/interestRoom', {
      name: 'testroom',
      displayName: 'Test Room',
    }, accessToken);
    assert.equal(status, 403);
    assert.equal(body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scheduled Events
// ─────────────────────────────────────────────────────────────────────────────
describe('Scheduled Events', () => {
  let eventId = '';

  test('GET /scheduledEvent - public, returns list', async () => {
    const { status, body } = await req('GET', '/scheduledEvent');
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.events));
  });

  test('POST /scheduledEvent - creates event', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { status, body } = await req('POST', '/scheduledEvent', {
      title: 'Test Event',
      scheduledAt: tomorrow,
      durationMinutes: 30,
      interestTags: ['gaming'],
    }, accessToken);
    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.title, 'Test Event');
    eventId = body.data._id;
  });

  test('POST /scheduledEvent/:id/join - cannot join own event twice', async () => {
    if (!eventId) return;
    await req('POST', `/scheduledEvent/${eventId}/join`, null, accessToken);
    const { status } = await req('POST', `/scheduledEvent/${eventId}/join`, null, accessToken);
    assert.equal(status, 400);
  });

  test('DELETE /scheduledEvent/:id - cancels event', async () => {
    if (!eventId) return;
    const { status, body } = await req('DELETE', `/scheduledEvent/${eventId}`, null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Matches
// ─────────────────────────────────────────────────────────────────────────────
describe('Match', () => {
  test('GET /match/active - returns array', async () => {
    const { status, body } = await req('GET', '/match/active', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  test('GET /match/history - returns paginated results', async () => {
    const { status, body } = await req('GET', '/match/history', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.matches));
  });

  test('POST /match/random - no other users returns 404', async () => {
    const { status } = await req('POST', '/match/random', null, accessToken);
    assert.equal(status, 404);
  });

  test('PUT /match/:id/end - nonexistent match returns 404', async () => {
    const { status } = await req('PUT', '/match/000000000000000000000000/end', null, accessToken);
    assert.equal(status, 404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Blocks
// ─────────────────────────────────────────────────────────────────────────────
describe('Block', () => {
  test('GET /block - returns empty blocked list', async () => {
    const { status, body } = await req('GET', '/block', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  test('POST /block - cannot block yourself', async () => {
    const { status, body } = await req('POST', '/block', {
      blockedUserId: userId,
    }, accessToken);
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────
describe('Report', () => {
  test('POST /report - cannot report yourself', async () => {
    const { status, body } = await req('POST', '/report', {
      reportedUserId: userId,
      reason: 'spam',
    }, accessToken);
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────
describe('Transactions', () => {
  test('GET /transaction/history - returns paginated list', async () => {
    const { status, body } = await req('GET', '/transaction/history', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.transactions));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────────────────────────────────────
describe('Subscription', () => {
  test('GET /subscription/me - returns free plan when no active sub', async () => {
    const { status, body } = await req('GET', '/subscription/me', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plans (public)
// ─────────────────────────────────────────────────────────────────────────────
describe('Plans', () => {
  test('GET /plans/active - public, returns array', async () => {
    const { status, body } = await req('GET', '/plans/active');
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  test('POST /plans - requires admin role', async () => {
    const { status } = await req('POST', '/plans', {
      name: 'pro',
      displayName: 'Pro Plan',
      price: 999,
      interval: 'month',
    }, accessToken);
    assert.equal(status, 403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verification
// ─────────────────────────────────────────────────────────────────────────────
describe('Verification', () => {
  test('GET /verification/my-status - not submitted', async () => {
    const { status, body } = await req('GET', '/verification/my-status', null, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'not_submitted');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (admin only)
// ─────────────────────────────────────────────────────────────────────────────
describe('Dashboard (admin-protected)', () => {
  test('GET /dashboardStats - non-admin returns 403', async () => {
    const { status } = await req('GET', '/dashboardStats', null, accessToken);
    assert.equal(status, 403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────────────────────────────────────
describe('404 Handler', () => {
  test('GET /api/nonexistent - returns 404', async () => {
    const { status, body } = await req('GET', '/nonexistent');
    assert.equal(status, 404);
    assert.equal(body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Logout (last — cleans up session)
// ─────────────────────────────────────────────────────────────────────────────
describe('Session Cleanup', () => {
  test('POST /session/logout - revokes refresh token', async () => {
    const { status, body } = await req('POST', '/session/logout', {
      refreshToken: refreshTokenValue,
    }, accessToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
  });
});
