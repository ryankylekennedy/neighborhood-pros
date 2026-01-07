# Neighborhood Invite System - User Guide

## Overview

The invite system allows you to send personalized invite codes to neighbors via direct mail (postcards/flyers) with QR codes. Each invite is single-use and tied to a specific neighborhood.

---

## How It Works

### For Neighbors (Users):
1. **Receive Mail** - Get a postcard with a QR code and invite code
2. **Scan QR Code** - Opens personalized welcome page
3. **See Neighborhood** - "Welcome to [Neighborhood Name] Collective"
4. **Click "Get Started"** - Goes to onboarding
5. **Fill Out Form** - 3 steps: Account, Name, Address
6. **Join!** - Instantly access the neighborhood directory

### For You (Admin):
1. **Generate Invite Codes** - Create codes for your mailing list
2. **Download QR Codes** - Get printable QR codes
3. **Print & Mail** - Send to neighborhood residents
4. **Track Usage** - See which invites have been redeemed

---

## Generating Invite Codes

### Step 1: Get Your Neighborhood ID

In Supabase SQL Editor, run:

```sql
SELECT id, name FROM neighborhoods;
```

Copy the `id` for your neighborhood.

### Step 2: Generate One Invite Code

```sql
-- Replace with your neighborhood ID
SELECT generate_invite_code('YOUR-NEIGHBORHOOD-ID-HERE');
```

Example output: `SUNSET-HILLS-A7B3`

### Step 3: Save the Invite

The code is automatically saved when you insert it:

```sql
INSERT INTO neighborhood_invites (code, neighborhood_id, recipient_name, recipient_address)
VALUES (
  generate_invite_code('YOUR-NEIGHBORHOOD-ID-HERE'),
  'YOUR-NEIGHBORHOOD-ID-HERE',
  'John Doe',  -- Optional: recipient name
  '123 Main St'  -- Optional: recipient address
);
```

### Step 4: Generate Multiple Invites (Bulk)

For a mailing campaign:

```sql
-- Generate 100 invites
DO $$
DECLARE
  v_neighborhood_id UUID := 'YOUR-NEIGHBORHOOD-ID-HERE';
  i INTEGER;
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO neighborhood_invites (code, neighborhood_id)
    VALUES (generate_invite_code(v_neighborhood_id), v_neighborhood_id);
  END LOOP;
END $$;
```

### Step 5: View Your Invites

```sql
SELECT code,
       is_redeemed,
       recipient_name,
       created_at
FROM neighborhood_invites
WHERE neighborhood_id = 'YOUR-NEIGHBORHOOD-ID-HERE'
ORDER BY created_at DESC;
```

---

## Creating QR Codes for Printing

### Option 1: Manual (One at a Time)

1. Copy an invite code from your database
2. Visit: `http://localhost:5173/invite/YOUR-CODE-HERE`
3. Take a screenshot of the QR code
4. Use in your design software

### Option 2: Component (Future Admin Dashboard)

The `InviteQRCode` component can be used in a future admin page to:
- Display QR codes
- Download as PNG files
- Bulk download for mail merge

Example usage:
```jsx
<InviteQRCode
  code="SUNSET-HILLS-A7B3"
  neighborhoodName="Sunset Hills"
/>
```

---

## Designing Your Postcard

### What to Include:

**Front:**
- Large QR code (center)
- "You're Invited!" heading
- Neighborhood name
- Brief description

**Back:**
- Invite code in large text
- Fallback URL: `yoursite.com/invite/CODE`
- What they'll get (benefits)
- Your contact info

### Example Template:

```
┌─────────────────────────────┐
│  YOU'RE INVITED!            │
│                             │
│  [QR CODE]                  │
│                             │
│  Join Sunset Hills          │
│  Collective                 │
│                             │
│  Scan to join your          │
│  neighborhood directory     │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Your Invite Code:          │
│  SUNSET-HILLS-A7B3          │
│                             │
│  Or visit:                  │
│  yoursite.com/invite/       │
│  SUNSET-HILLS-A7B3          │
│                             │
│  What You'll Get:           │
│  • Vetted local pros        │
│  • Exclusive member deals   │
│  • Neighbor reviews         │
└─────────────────────────────┘
```

---

## Tracking Invite Usage

### See All Redeemed Invites

```sql
SELECT code,
       (SELECT email FROM auth.users WHERE id = redeemed_by) as user_email,
       redeemed_at
FROM neighborhood_invites
WHERE is_redeemed = true
ORDER BY redeemed_at DESC;
```

### See Redemption Rate

```sql
SELECT
  COUNT(*) as total_invites,
  SUM(CASE WHEN is_redeemed THEN 1 ELSE 0 END) as redeemed,
  ROUND(100.0 * SUM(CASE WHEN is_redeemed THEN 1 ELSE 0 END) / COUNT(*), 2) as redemption_rate_percent
FROM neighborhood_invites
WHERE neighborhood_id = 'YOUR-NEIGHBORHOOD-ID-HERE';
```

### See Unredeemed Invites

```sql
SELECT code, created_at
FROM neighborhood_invites
WHERE is_redeemed = false
  AND neighborhood_id = 'YOUR-NEIGHBORHOOD-ID-HERE'
ORDER BY created_at DESC;
```

---

## Testing the Flow

### Test an Invite:

1. Generate a test invite code
2. Open: `http://localhost:5173/invite/YOUR-CODE`
3. You should see the welcome page
4. Click "Get Started"
5. Fill out the 3-step form
6. Complete signup

### Verify It Worked:

```sql
-- Check if invite was redeemed
SELECT * FROM neighborhood_invites WHERE code = 'YOUR-CODE';

-- Check if user was created
SELECT id, email, full_name, neighborhood_id, address
FROM profiles
WHERE neighborhood_id = 'YOUR-NEIGHBORHOOD-ID-HERE'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Common Tasks

### Invalidate an Invite Code

```sql
UPDATE neighborhood_invites
SET is_redeemed = true
WHERE code = 'CODE-TO-INVALIDATE';
```

### Delete Unused Invites

```sql
DELETE FROM neighborhood_invites
WHERE is_redeemed = false
  AND created_at < NOW() - INTERVAL '90 days';
```

### Generate a Custom Code

```sql
-- Note: Must follow format NEIGHBORHOOD-NAME-XXXX
INSERT INTO neighborhood_invites (code, neighborhood_id)
VALUES ('SUNSET-HILLS-SPEC', 'YOUR-NEIGHBORHOOD-ID-HERE');
```

---

## Security Features

✅ **Single-Use**: Each code works only once
✅ **Neighborhood-Locked**: Users can only see businesses in their neighborhood
✅ **No Switching**: Once joined, users cannot change neighborhoods
✅ **Validated**: Codes are validated before signup
✅ **Atomic**: Redemption uses database locks to prevent race conditions

---

## Troubleshooting

### "Invalid invite code" Error
- Check the code is correct (case-insensitive)
- Verify the invite exists in the database
- Make sure it hasn't been redeemed already

### "Already been used" Error
- This code has been redeemed
- Generate a new code for this recipient

### User Can't See Businesses
- Verify their profile has the correct `neighborhood_id`
- Check RLS policies are enabled
- Run security policies migration if not done yet

---

## Future Enhancements

Planned features for the invite system:

- **Admin Dashboard**: GUI for generating invites
- **Bulk Export**: Download all QR codes as ZIP
- **Mail Merge**: CSV export for printing services
- **Analytics**: Detailed redemption tracking
- **Expiration**: Optional time limits on codes
- **Custom Messages**: Personalized welcome text

---

## Support

If you encounter issues:

1. Check the Supabase logs for errors
2. Verify database functions exist: `generate_invite_code`, `redeem_invite_code`
3. Ensure RLS policies are enabled
4. Review browser console for frontend errors

For questions, refer to the implementation plan or ask Claude for help!
