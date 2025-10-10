# Debug: Failed to Fetch Issue

## Potential Causes

### 1. Dev Server Not Running
- Ensure `npm run dev` is running
- Check if server is on `localhost:3000` (or your configured port)
- Look for any server startup errors in terminal

### 2. Network/CORS Issue
- Check browser console for CORS errors
- Ensure API routes are accessible

### 3. Role Validation Issue (Most Likely)
Since we just added role validation, the user might not have the required role:

**For applying to jobs:** User needs `worker` role
**For posting jobs:** User needs `recruiter` role  
**For buying/selling:** User needs `buyer` role

## Quick Fixes

### Fix 1: Add Better Error Handling
Update the authFetch to provide more context on errors.

### Fix 2: Add Role Check Before Showing Apply Button
The JobApplication component should check if user has worker role before showing apply button.

### Fix 3: Show User-Friendly Message
If user lacks required role, show message prompting them to update roles in settings.

## Testing Steps

1. Open browser console (F12)
2. Try to apply to a job
3. Look for specific error messages
4. Check if user is logged in
5. Verify user has "worker" role in settings

## Common Scenarios

### Scenario A: User Not Logged In
- authFetch will fail because no token
- Solution: Redirect to login

### Scenario B: User Lacks Worker Role
- API returns 403 with message about needing worker role
- Solution: Show message with link to settings

### Scenario C: Server Not Running
- Fetch fails immediately with network error
- Solution: Start/restart dev server

