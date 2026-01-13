# Debugging Permission Issues

## Current Issues

1. **Child Login**: Children don't have Firebase Auth accounts, so they can't read their own data
2. **Parent Dashboard**: Parent queries by child's userId fail with permission errors

## Root Cause

Children use PIN-based authentication which doesn't create Firebase Auth sessions. This means:
- Children are never `isAuthenticated()` in Firestore rules
- Children can't read their own logs/summaries
- Parent queries by child's userId need special handling

## Solution Approach

We need to allow:
1. **Unauthenticated reads for children** - Children need to read their own data without Firebase Auth
2. **Parent queries by child userId** - Parents need to query logs/summaries by child's ID

## Current Rules Status

### Activity Logs
- ✅ Users can read their own logs (requires auth)
- ✅ Parents can read logs by familyId match
- ❌ Children can't read their own logs (no auth)
- ❌ Parent queries by child userId might fail

### Daily Summaries  
- ✅ Users can read their own summaries (requires auth)
- ✅ Parents can read summaries by familyId match
- ❌ Children can't read their own summaries (no auth)
- ❌ Parent queries by child userId might fail

## Fix Strategy

1. Add rule: Allow reading logs/summaries where `userId` matches a child in the same family (for parent queries)
2. Add rule: Allow unauthenticated reads for children's own data (using a different mechanism)

Actually, wait - children DO get authenticated in the app context (via `setUser`), but they don't have Firebase Auth. So we need a way to identify children in the rules.

The best approach: Use custom claims or allow queries by userId when the document's familyId matches the requester's familyId.
