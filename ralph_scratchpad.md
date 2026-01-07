# Ralph's Scratchpad 🎨

*"I'm helping! I'm helping!"*

This is Ralph's special thinking space where he works through problems before touching the real code.

---

## What Ralph is Working On

**Iteration 2: Core Hooks for Invite System**

Building React hooks to validate invites and manage onboarding flow.

## Ralph's Thinking Out Loud

### Hooks Architecture

**Hook 1: useInvite**
Purpose: Validate and redeem invite codes
Functions needed:
- `validateInvite(code)` - Check if code exists and is unredeemed
- `redeemInvite(code, userId)` - Mark code as used
State needed:
- `loading` - Boolean for API calls
- `error` - Error messages

**Hook 2: useOnboarding**
Purpose: Manage the multi-step onboarding form
State needed:
- `step` - Current step number (1, 2, or 3)
- `formData` - Object with: email, password, fullName, address
Functions needed:
- `nextStep()` - Move to next step
- `prevStep()` - Go back
- `updateFormData(field, value)` - Update a field
- `submitOnboarding(inviteCode, neighborhoodId)` - Complete signup

**Hook 3: Modify useAuth**
Add new function:
- `signUpWithInvite(email, password, fullName, neighborhoodId, address, inviteCode)`
This orchestrates:
1. Create auth account
2. Update profile with neighborhood + address
3. Redeem invite code

### Database Tables Needed (COMPLETED ✓)

**1. neighborhood_invites table**
- Primary purpose: Store invite codes and track their usage
- Key fields:
  - `id` - UUID primary key
  - `code` - The actual invite code (e.g., "SUNSET-HILLS-A7B3")
  - `neighborhood_id` - Which neighborhood this invite is for
  - `is_redeemed` - Boolean flag for single-use enforcement
  - `redeemed_by` - FK to auth.users (who used it)
  - `redeemed_at` - Timestamp of redemption
  - `recipient_name`, `recipient_address` - For tracking who got the mailer
  - `created_at`, `created_by` - Audit trail
  - `metadata` - JSONB for future flexibility

**2. profiles table modification**
- Need to add `address` column (TEXT)
- This stores the street address collected during onboarding

### Functions Needed

**1. generate_invite_code(neighborhood_id)**
Purpose: Create human-readable codes like "SUNSET-HILLS-A7B3"
Process:
- Get neighborhood name from database
- Normalize it (uppercase, remove special chars, spaces to hyphens)
- Generate random 4-char suffix
- Check uniqueness
- Retry if collision (up to 100 attempts)

**2. redeem_invite_code(code, user_id)**
Purpose: Atomically mark an invite as used
Process:
- Use FOR UPDATE lock to prevent race conditions
- Validate code exists
- Check not already redeemed
- Update is_redeemed, redeemed_by, redeemed_at
- Return success/error as JSONB

### RLS Policies Needed

**For neighborhood_invites:**
1. SELECT policy: Anyone can view unredeemed invites by code
   - Why: Need to validate codes before signup
   - Constraint: Only show unredeemed OR user's own redeemed invites

2. UPDATE policy: Authenticated users can redeem invites
   - Why: Users need to mark invite as used during signup
   - Constraint: Only if not already redeemed

**For profiles (addition):**
3. Prevent neighborhood switching after initial setup
   - Why: Users shouldn't be able to join multiple neighborhoods
   - Implementation: Check if neighborhood_id matches existing value

**For businesses (addition):**
4. Filter by user's neighborhood
   - Why: Users should only see businesses in their neighborhood
   - Implementation: Join with profiles table to check neighborhood_id

### Security Concerns

**Attack Vector 1: Code guessing**
- Mitigation: Long enough random suffix (4 chars = 1.6M combinations)
- Additional: Rate limiting could be added later

**Attack Vector 2: Race condition on redemption**
- Mitigation: FOR UPDATE lock in redeem function
- This ensures atomic check-and-update

**Attack Vector 3: User switches neighborhoods**
- Mitigation: RLS policy prevents changing neighborhood_id after set
- Check in UPDATE policy WITH CHECK clause

**Attack Vector 4: Accessing other neighborhood's data**
- Mitigation: RLS policies on businesses table
- Filter all queries by user's neighborhood_id

## What Ralph Learned

- Supabase RLS policies need both USING and WITH CHECK clauses for UPDATE
- USING = who can attempt the update
- WITH CHECK = what the final state must satisfy

- FOR UPDATE lock in PostgreSQL prevents race conditions
- Must be used in a transaction (which our function provides)

- JSONB metadata field gives flexibility for future features without migrations

- Code format constraint (CHECK code = UPPER(code)) ensures consistency

## Ralph's Plan

### Step 1: Test Database Connection
- Make sure Supabase is accessible
- Verify current tables exist

### Step 2: Create Migration File
- Create a single SQL file with all the schema changes
- Include: table creation, indexes, RLS policies, functions

### Step 3: Run Migration in Supabase GUI
- Ryan will run this in the SQL Editor
- Test each part separately (table → indexes → RLS → functions)

### Step 4: Test Functions
- Generate a test invite code
- Try to redeem it
- Verify single-use enforcement works

### Step 5: Test RLS Policies
- Create test users
- Verify they can only see unredeemed invites
- Verify they can redeem invites
- Verify they can't redeem twice

---

*Remember: This scratchpad gets messy. That's okay! Ralph works it out here so the real code stays clean.*
