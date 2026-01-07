# Testing Guide - Invite System

## Step 1: Fix Database Permissions

**IMPORTANT: Do this first!**

1. Go to Supabase Dashboard → SQL Editor
2. Open the file: `RUN_THIS_IN_SUPABASE.sql` (in this project folder)
3. Copy the SQL and paste it into Supabase SQL Editor
4. Click "Run"

This adds the missing INSERT policy so you can generate invites.

## Step 2: Access the Admin Dashboard

1. Make sure you're signed in to the app
2. Go to: `http://localhost:5173/admin/invites`
3. You should see the Invite Management dashboard with stats and tabs

## Step 3: Generate Your First Invite

1. On the Admin page, click the "Generate Invites" tab
2. Click "Generate Single Invite"
3. You should see a success message with your new invite code (like "DENTON-A7B3")
4. The code will appear in the "Manage Invites" tab

## Step 4: Test the Invite Flow

1. Copy the invite code you just generated
2. Open a new incognito/private browser window
3. Go to: `http://localhost:5173/invite/YOUR-CODE-HERE`
4. You should see the welcome page with your neighborhood name
5. Click "Get Started"
6. Fill out the 3-step onboarding form:
   - Step 1: Email and password
   - Step 2: Your name
   - Step 3: Your address
7. Click "Complete Signup"
8. You should be redirected to the home page, signed in

## Step 5: Verify Everything Worked

1. Go back to the admin dashboard (in your original browser)
2. Click "Manage Invites" tab
3. Find the code you used - it should show "Redeemed" status
4. Check the stats at the top - redemption count should have increased

## Step 6: Download a QR Code

1. In the "Manage Invites" tab, click "View QR" on any invite
2. The "QR Code" tab will open
3. Click "Download QR Code" to save it as a PNG
4. This QR code can be printed on direct mail pieces

## What's Working Now

✅ Database schema and functions
✅ Invite generation (single and bulk)
✅ QR code generation and download
✅ Invite validation
✅ Personalized welcome page
✅ 3-step onboarding flow
✅ Security policies (single-use codes, neighborhood isolation)
✅ Admin dashboard with stats
✅ CSV export of invites

## Common Issues

**"Invalid invite code"**
- Make sure the code is typed correctly (case doesn't matter)
- Check it hasn't been used already

**"Row-level security policy" error when generating invites**
- You need to run the SQL from `RUN_THIS_IN_SUPABASE.sql`

**Can't see Admin link in header**
- Make sure you're signed in
- Make sure your profile has a neighborhood_id set

**Dev server errors**
- Try killing the dev server and running `npm run dev` again

## Next Steps

Once you've tested and everything works:

1. Generate invites for your real mailing list (bulk generation)
2. Download QR codes for each invite
3. Design your direct mail piece
4. Send them out!
5. Track redemptions in the admin dashboard

## Getting Help

If something doesn't work:
1. Check the browser console for errors (F12 → Console tab)
2. Check the Supabase logs in the dashboard
3. Verify the SQL migrations were run correctly
