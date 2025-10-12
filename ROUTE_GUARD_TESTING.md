# Route Guard Testing Guide

This guide will help you test the route guard implementation to ensure unauthorized users cannot access protected pages via URL manipulation.

## Setup

Before testing, ensure you have:
1. The dev server running (`npm run dev`)
2. At least 3 test user accounts with different roles:
   - User A: Worker
   - User B: Recruiter
   - User C: Buyer
   - User D: Admin

## Test Cases

### Test 1: Unauthenticated Access

**Objective:** Verify that unauthenticated users are redirected to login

**Steps:**
1. Log out or use an incognito window
2. Try to navigate to these URLs:
   - `/dashboard`
   - `/profile`
   - `/settings`
   - `/opportunities/post`
   - `/marketplace/sell`
   - `/notifications`
   - `/admin`

**Expected Result:**
- All URLs should redirect to `/auth/login?redirect=<original_url>`
- After login, user should be redirected back to original URL

**✅ Pass:** All routes redirect to login
**❌ Fail:** Any route shows content without authentication

---

### Test 2: Worker Role Access

**Objective:** Verify worker can only access appropriate pages

**Steps:**
1. Log in as User A (Worker role only)
2. Try to navigate to:
   - `/opportunities` ✅ Should work
   - `/opportunities/<job-id>` ✅ Should work (can view and apply)
   - `/opportunities/post` ❌ Should redirect to /opportunities
   - `/opportunities/edit/<job-id>` ❌ Should redirect to /opportunities
   - `/marketplace` ✅ Should work (can view)
   - `/marketplace/sell` ❌ Should redirect to /marketplace
   - `/admin` ❌ Should redirect to /dashboard

**Expected Results:**
- Worker can browse opportunities and marketplace
- Worker CANNOT post/edit jobs
- Worker CANNOT sell products
- Worker CANNOT access admin panel
- Toast notifications show appropriate error messages

**✅ Pass:** All access rules enforced correctly
**❌ Fail:** Worker can access restricted pages

---

### Test 3: Recruiter Role Access

**Objective:** Verify recruiter can only access appropriate pages

**Steps:**
1. Log in as User B (Recruiter role only)
2. Try to navigate to:
   - `/opportunities` ✅ Should work
   - `/opportunities/post` ✅ Should work (can post jobs)
   - `/opportunities/edit/<own-job-id>` ✅ Should work (can edit own jobs)
   - `/opportunities/edit/<other-job-id>` ❌ Should redirect to /opportunities
   - `/marketplace` ✅ Should work (can view)
   - `/marketplace/sell` ❌ Should redirect to /marketplace
   - `/admin` ❌ Should redirect to /dashboard

**Expected Results:**
- Recruiter can post and edit own jobs
- Recruiter CANNOT edit other users' jobs
- Recruiter CANNOT sell products
- Recruiter CANNOT access admin panel

**✅ Pass:** All access rules enforced correctly
**❌ Fail:** Recruiter can access restricted pages

---

### Test 4: Buyer Role Access

**Objective:** Verify buyer can only access appropriate pages

**Steps:**
1. Log in as User C (Buyer role only)
2. Try to navigate to:
   - `/marketplace` ✅ Should work
   - `/marketplace/sell` ✅ Should work (can sell products)
   - `/marketplace/edit/<own-product-id>` ✅ Should work (can edit own products)
   - `/marketplace/edit/<other-product-id>` ❌ Should redirect to /marketplace
   - `/opportunities` ✅ Should work (can view)
   - `/opportunities/post` ❌ Should redirect to /opportunities
   - `/admin` ❌ Should redirect to /dashboard

**Expected Results:**
- Buyer can sell and edit own products
- Buyer CANNOT edit other users' products
- Buyer CANNOT post jobs
- Buyer CANNOT access admin panel

**✅ Pass:** All access rules enforced correctly
**❌ Fail:** Buyer can access restricted pages

---

### Test 5: Dual-Role Access

**Objective:** Verify users with multiple roles have correct permissions

**Setup:** Give User A roles: `["worker", "buyer"]`

**Steps:**
1. Log in as User A (Worker + Buyer)
2. Try to navigate to:
   - `/opportunities` ✅ Should work
   - `/opportunities/<job-id>` ✅ Should work (can apply as worker)
   - `/opportunities/post` ❌ Should redirect (no recruiter role)
   - `/marketplace` ✅ Should work
   - `/marketplace/sell` ✅ Should work (can sell as buyer)
   - `/admin` ❌ Should redirect (no admin role)

**Expected Results:**
- User can perform actions for ALL their roles
- User CANNOT perform actions for roles they don't have

**✅ Pass:** All role combinations work correctly
**❌ Fail:** User can't access pages for their assigned roles

---

### Test 6: Admin Access

**Objective:** Verify admin has access to all pages

**Steps:**
1. Log in as User D (Admin role)
2. Try to navigate to:
   - `/admin` ✅ Should work
   - `/admin/users` ✅ Should work
   - `/admin/content/opportunities` ✅ Should work
   - `/admin/reports` ✅ Should work
   - `/opportunities/edit/<any-job-id>` ✅ Should work (admin override)
   - `/marketplace/edit/<any-product-id>` ✅ Should work (admin override)

**Expected Results:**
- Admin can access all admin pages
- Admin can edit ANY job or product (override)

**✅ Pass:** Admin has full access
**❌ Fail:** Admin is restricted from any page

---

### Test 7: Self-Interaction Prevention

**Objective:** Verify users cannot interact with their own content inappropriately

**Steps:**
1. Log in as User B (Recruiter with dual role: `["recruiter", "worker"]`)
2. Post a job as recruiter
3. Try to apply to your own job
4. Expected: Error message "You cannot apply to your own job posting"

5. Log in as User C (Buyer)
6. Create a product listing
7. Try to buy your own product
8. Expected: Error message "You cannot buy your own product"

**Expected Results:**
- Users cannot apply to jobs they posted
- Users cannot buy products they're selling
- Clear error messages for each case

**✅ Pass:** Self-interaction is properly prevented
**❌ Fail:** Users can interact with their own content

---

### Test 8: URL Manipulation

**Objective:** Verify direct URL access is properly guarded

**Steps:**
1. Log in as User A (Worker only)
2. Open browser developer tools (F12) → Network tab
3. Copy URL: `/opportunities/post`
4. Navigate to it by:
   - Pasting in address bar
   - Opening in new tab
   - Using browser back/forward
   - Refreshing the page

**Expected Results:**
- ALL navigation methods should trigger the guard
- User should be redirected with toast notification
- No flash of protected content

**✅ Pass:** Guards work on all navigation methods
**❌ Fail:** Content shows briefly before redirect

---

### Test 9: Middleware Performance

**Objective:** Verify middleware doesn't slow down the app

**Steps:**
1. Open browser developer tools (F12) → Network tab
2. Navigate to various pages
3. Check the timing of the initial HTML document load
4. Look for any routes that take >200ms to respond

**Expected Results:**
- Middleware adds <50ms overhead
- No noticeable performance impact
- Server responses remain fast

**✅ Pass:** No performance degradation
**❌ Fail:** Pages load significantly slower

---

### Test 10: Token Expiration

**Objective:** Verify expired tokens are handled correctly

**Steps:**
1. Log in normally
2. Wait for access token to expire (15 minutes by default)
3. Try to navigate to a protected page
4. If token refresh works, proceed to next step
5. Delete cookies manually (simulate full logout)
6. Try to access protected page

**Expected Results:**
- Expired token triggers automatic refresh
- If refresh fails, redirect to login
- No app crashes or console errors

**✅ Pass:** Token expiration handled gracefully
**❌ Fail:** App errors or allows access with expired token

---

## Quick Test Checklist

Use this checklist for rapid testing:

### Unauthenticated User
- [ ] Cannot access `/dashboard`
- [ ] Cannot access `/profile`
- [ ] Cannot access `/settings`
- [ ] Cannot access `/admin`
- [ ] Redirected to login with proper redirect URL

### Worker Role
- [ ] Can view opportunities
- [ ] Cannot post jobs
- [ ] Cannot sell products
- [ ] Cannot access admin

### Recruiter Role
- [ ] Can post jobs
- [ ] Can edit own jobs only
- [ ] Cannot sell products
- [ ] Cannot access admin

### Buyer Role
- [ ] Can sell products
- [ ] Can edit own products only
- [ ] Cannot post jobs
- [ ] Cannot access admin

### Multi-Role User
- [ ] Can perform all actions for assigned roles
- [ ] Cannot perform actions for unassigned roles

### Admin
- [ ] Can access admin panel
- [ ] Can edit any job or product

### Self-Interaction
- [ ] Cannot apply to own jobs
- [ ] Cannot buy own products

---

## Common Issues and Solutions

### Issue 1: Redirect Loop
**Symptom:** Page keeps redirecting endlessly
**Cause:** Fallback URL also requires same role
**Solution:** Check middleware patterns and ensure fallback URLs are accessible

### Issue 2: Flash of Content
**Symptom:** Protected content shows briefly before redirect
**Cause:** Client-side guard running after initial render
**Solution:** This is expected for client components; middleware should catch it on page load

### Issue 3: Role Not Recognized
**Symptom:** User has role but can't access page
**Cause:** JWT token not updated with new roles
**Solution:** User needs to log out and log back in to refresh token

### Issue 4: Can Access Via URL But Not Navigation
**Symptom:** Direct URL works but clicking links redirects
**Cause:** Client-side routing handled differently
**Solution:** Check both middleware and client-side guards

---

## Automated Testing Script

Run this in browser console to test multiple scenarios:

```javascript
// Test route access
const testRoutes = async () => {
  const routes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/opportunities/post',
    '/marketplace/sell',
    '/admin',
    '/notifications'
  ];

  for (const route of routes) {
    try {
      const response = await fetch(route, { method: 'HEAD' });
      console.log(`${route}: ${response.status} ${response.redirected ? '(redirected)' : ''}`);
    } catch (e) {
      console.error(`${route}: Error - ${e.message}`);
    }
  }
};

testRoutes();
```

---

## Security Verification

Before deploying, verify:

- [ ] All protected routes have middleware patterns
- [ ] Server components use `requireAuth` or `requireRole`
- [ ] Client components use `<RouteGuard>`
- [ ] API routes validate roles server-side
- [ ] No sensitive data exposed before auth check
- [ ] Console has no JWT tokens or sensitive data
- [ ] Network tab shows no auth tokens in URLs

---

## Report Template

Use this template to report test results:

```
## Route Guard Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]

### Test Results
- Test 1 (Unauthenticated): ✅/❌
- Test 2 (Worker Role): ✅/❌
- Test 3 (Recruiter Role): ✅/❌
- Test 4 (Buyer Role): ✅/❌
- Test 5 (Dual-Role): ✅/❌
- Test 6 (Admin): ✅/❌
- Test 7 (Self-Interaction): ✅/❌
- Test 8 (URL Manipulation): ✅/❌
- Test 9 (Performance): ✅/❌
- Test 10 (Token Expiration): ✅/❌

### Issues Found
[List any issues]

### Notes
[Any additional observations]
```

---

## Next Steps After Testing

1. Fix any failed test cases
2. Add logging for unauthorized access attempts
3. Set up monitoring for excessive redirects
4. Document any edge cases discovered
5. Update route guard rules as needed

For production, consider:
- Rate limiting on auth endpoints
- IP blocking for repeated unauthorized access
- Audit logs for admin actions
- Session management improvements

