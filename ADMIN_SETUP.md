# Admin Setup & Login Guide

## Accessing the Admin Panel
To access the admin settings, scroll to the bottom of any page and click the **Admin** link in the footer. If you are not logged in, the system will automatically prompt you for your credentials.

### Logging In
1. Enter your Supabase admin email
2. Enter your Supabase admin password
3. Click "Login"

When successful, the console (F12) will show:
```
Admin login attempt with email: your-email@example.com
adminSignIn called with email: your-email@example.com
adminSignIn result - user: { email: "your-email@example.com", ... } error: null
Auth response - user: { ... } error: null
Login successful for: your-email@example.com
```

## How to Login with Supabase Email Authentication

### Step 1: Open Browser Console
1. Open your site in a browser (e.g., `localhost` or your deployed URL)
2. Press `F12` to open Developer Tools
3. Click the "Console" tab
4. Leave the console open and test the login

### Step 2: Check Console Logs
When the page loads, you should see these messages in the console:
```
initSupabase called. Checking for Supabase library...
Supabase library loaded after 0 ms
Supabase client initialized successfully
DOMContentLoaded event fired. Starting app initialization...
Supabase initialized, loading settings...
Site settings loaded.
App initialization complete!
```

If you don't see these messages:
- **Check the Network tab** to ensure `js/supabase.js`, `js/main.js`, and the Supabase CDN script are loading
- **Check for errors in the console** (red error messages)

### Step 3: Open Admin Login
You can access admin login in two ways:
1. **Click "Admin" button** in the navigation menu (red button)
2. **Use keyboard shortcut**: Press `Ctrl + Alt + Z`

### Step 4: Login with Supabase Email
1. Enter your **Supabase admin email** (the one you set up in Supabase)
2. Enter your **Supabase admin password**
3. Click "Login"

In the console, you should see:
```
Attempting admin login with: your-email@example.com
Supabase login successful for: your-email@example.com
Login result: { user: { email: "your-email@example.com", ... }, error: null }
Login successful! Redirecting...
```

## Setting Up Supabase Admin Account

### Step 1: Create Admin User in Supabase
1. Go to https://supabase.com and sign in
2. Navigate to your project: `https://edalozmblhdautywwouz.supabase.co`
3. Go to **Authentication** → **Users**
4. Click **Invite User**
5. Enter the admin email address
6. Check your email for the invite link
7. Click the link and set your password

### Step 2: Verify Admin in Database
1. Go to **SQL Editor** in Supabase
2. Go to **Authentication** -> **Users** and copy the **User ID** (UUID) for your email.
3. Run this query to add the admin to the `admin_users` table (replace the placeholders):
```sql
INSERT INTO admin_users (id, email) 
VALUES ('your-user-uuid-here', 'your-email@example.com')
ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id;
```

Replace `'your-email@example.com'` with your actual admin email.

Alternatively, in **Table Editor**, click on `admin_users` table and manually add a row with:
- `id`: (auto-generated)
- `email`: your admin email

## Troubleshooting

### Console shows "Supabase library not loaded"
- Check that the CDN script loads: https://unpkg.com/@supabase/supabase-js@2
- Check the Network tab for 404 or timeout errors
- Try refreshing the page

### Login says "Invalid email or password"
- Make sure you confirmed the invite email from Supabase
- Verify your email exists in the `admin_users` table
- Check that you're using the correct email/password

### Shortcut doesn't work when typing
- This is by design! The shortcut is intentionally disabled in text inputs/textareas to avoid conflicts
- Click outside the input first, then use `Ctrl + Alt + Z`

### Still having issues?
1. Open the browser console (F12)
2. Check all error messages
3. Copy the full error message and share it
4. Check the Network tab for any failed requests
