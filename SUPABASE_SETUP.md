# Supabase Integration Setup Guide

## Step 1: Run the SQL Setup

1. Go to your Supabase project: https://edalozmblhdautywwouz.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase-setup.sql` from this repository
5. Paste it into the SQL editor
6. Click **Run**

This will create the necessary tables, the public `therapist-images` Storage bucket, and the RLS policies needed for therapist photo uploads.

## Step 2: Create Admin Users

Run this SQL query in the SQL Editor to add your admin email:

```sql
INSERT INTO admin_users (email)
VALUES ('your-admin-email@example.com');
```

Replace `your-admin-email@example.com` with your actual email.

## Step 3: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings as needed

## Step 4: Create an Admin User Account

1. Go to **Authentication** → **Users**
2. Click **Invite user**
3. Enter the admin email address and click **Send invitation**
4. Check the email for the signup link
5. Set a password for the account

## Step 5: Test the Integration

1. Open your site's admin page at `/admin/add-therapist.html`
2. Use keyboard shortcut `Ctrl+Z` then `Ctrl+X` to open admin login
3. Log in with your Supabase admin email and password
4. Try saving business settings — they should now sync to Supabase
5. Check the Supabase dashboard to verify the data is being saved

## How It Works

- **Business Settings & Services**: Saved to Supabase `site_settings` table
- **Therapist Profiles**: Saved to the `therapists` table
- **Therapist Pictures**: Uploaded to the public `therapist-images` Supabase Storage bucket, with only public image URLs saved in the therapist row and browser cache
- **Therapist Drafts**: Uploaded drafts go to `therapist_drafts` table
- **Bookings**: Still saved to Google Sheets (as per your requirement)
- **Admin Auth**: Uses Supabase Auth instead of hardcoded credentials

## Fallback Behavior

If Supabase is unavailable, the app will automatically fall back to localStorage and continue working with cached data. This ensures your site remains functional even if the database is temporarily down.

## Next Steps

1. Migrate existing therapist data to the `therapists` table
2. Confirm the `therapist-images` Storage bucket exists after running `supabase-setup.sql`
3. Connect the booking Google Sheets integration
4. Consider enabling additional auth providers (Google, GitHub, etc.)

## Troubleshooting

- **Login not working**: Make sure your email is added to `admin_users` table
- **Settings not saving**: Check browser console for Supabase errors
- **Therapists not loading**: Verify `therapists` table has data or hardcoded data is available
- **Photo upload failing**: Run `supabase-setup.sql` again and confirm the `therapist-images` bucket exists in Supabase Storage
