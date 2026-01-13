# Testing Firestore Rules

## Test Cases to Verify

### 1. Child Login Flow
- [ ] Child can query families by inviteCode (unauthenticated)
- [ ] Child can query child users by familyId (unauthenticated)  
- [ ] Child can update lastLoginAt after PIN verification (unauthenticated)
- [ ] Child can read their own logs (NEEDS FIX - children not authenticated)
- [ ] Child can read their own summaries (NEEDS FIX - children not authenticated)

### 2. Parent Dashboard
- [ ] Parent can query logs by child's userId
- [ ] Parent can query summaries by child's userId
- [ ] Parent can query logs by familyId
- [ ] Parent can query summaries by familyId

## Current Issues

1. **Children can't read their own data** - They're not authenticated in Firebase Auth
2. **Parent queries by child userId fail** - Rules might not be evaluating correctly

## Potential Solutions

### Option 1: Allow unauthenticated reads for children's own data
- Problem: Can't verify it's "their own" without auth
- Risk: Security issue

### Option 2: Create Firebase Auth sessions for children
- Problem: Defeats purpose of PIN-based login
- Complexity: High

### Option 3: Use a session token system
- Store session tokens in Firestore
- Verify tokens in rules
- Complexity: Medium

### Option 4: Allow reads where familyId matches (for children)
- Allow unauthenticated reads if document's userId matches a child in a family
- But we can't verify the requester without auth
- Not secure

## Recommended Approach

Since children use PIN-based auth and don't have Firebase Auth sessions, we need to:
1. Allow children to read their own logs/summaries using a different mechanism
2. Use a session document or custom token
3. OR: Create anonymous Firebase Auth sessions for children

Actually, the simplest solution: Create anonymous Firebase Auth accounts for children when they log in with PIN. This gives them an auth session without requiring email/password.
