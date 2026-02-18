# 🚀 Supabase Migration Complete - Setup Instructions

## ✅ What's Been Done

1. ✅ Installed `@supabase/supabase-js` client
2. ✅ Created Supabase config at `lib/supabase/config.ts`
3. ✅ Created TypeScript types at `types/supabase.ts`
4. ✅ Created complete database schema at `supabase/schema.sql`
5. ✅ Updated AuthContext to use Supabase Auth
6. ✅ Updated environment variables

## 🎯 Next Steps - YOU NEED TO DO THESE:

### Step 1: Create Supabase Project

1. Go to https://supabase.com and create a free account
2. Click "New Project"
3. Fill in:
   - **Project Name**: tikiti-webapp-production
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to Kenya (e.g., Singapore or Mumbai)
4. Click "Create new project" (takes ~2 minutes)

### Step 2: Get Your Supabase Credentials

1. Once project is created, go to **Settings (⚙️) → API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with: `eyJhbGc...`)
   - **service_role** key (starts with: `eyJhbGc...`) - **KEEP THIS SECRET!**

3. Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

### Step 3: Setup Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase/schema.sql` from your project
4. **Copy ALL the SQL code** from that file
5. **Paste it** into the Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. Wait for "Success! No rows returned" message

This creates:
- All database tables (users, events, tickets, orders, favorites, etc.)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for auto-updating timestamps
- User profile creation trigger

### Step 4: Setup Storage Buckets

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Create these 3 buckets:

#### Bucket 1: `event-images`
- Click "Create bucket"
- Name: `event-images`
- **Public bucket**: ✅ YES
- Click "Create bucket"
- Go to bucket → "Policies" tab → "New Policy" → Use this:
  ```sql
  -- Allow public read
  CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-images');
  
  -- Allow authenticated users to upload
  CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'event-images' AND
      auth.role() = 'authenticated'
    );
  ```

#### Bucket 2: `profile-images`
- Name: `profile-images`
- **Public bucket**: ✅ YES
- Storage Policies:
  ```sql
  -- Allow public read
  CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');
  
  -- Allow users to upload own profile image
  CREATE POLICY "Users can upload own profile" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'profile-images' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  ```

#### Bucket 3: `ticket-qr-codes`
- Name: `ticket-qr-codes`
- **Public bucket**: ❌ NO (private)
- Storage Policies:
  ```sql
  -- Users can only read their own QR codes
  CREATE POLICY "Users can read own QR codes" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'ticket-qr-codes' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  ```

### Step 5: Disable Email Confirmation (Optional - for development)

By default, Supabase requires email confirmation for new signups.

**For development/testing**, you can disable this:
1. Go to **Authentication → Providers → Email**
2. Scroll to **"Confirm email"**
3. Toggle ❌ OFF
4. Click "Save"

**For production**, leave it ON and setup email templates!

### Step 6: Test Your Setup

Run your Next.js app:
```bash
npm run dev
```

Try:
1. ✅ Register a new account
2. ✅ Login with that account
3. ✅ Check Supabase Dashboard → **Table Editor** → `users` table
4. ✅ You should see your new user there!

---

## 🧹 Cleanup - Remove Firebase (Optional)

After Supabase is working, remove Firebase:

```bash
# Uninstall Firebase dependencies
npm uninstall firebase firebase-admin firebase-functions firebase-functions-test

# Delete Firebase files
rm -rf functions/
rm firebase.json
rm firestore.rules
rm storage.rules
rm lib/firebase/

# Or on Windows PowerShell:
Remove-Item -Recurse -Force functions, firebase.json, firestore.rules, storage.rules, lib/firebase
```

---

## 📊 Database Structure Overview

Your Supabase database has these tables:

| Table | Description |
|-------|-------------|
| `users` | User profiles (extends Supabase Auth) |
| `events` | Event listings created by organizers |
| `ticket_types` | Different ticket tiers per event (VIP, Regular, etc.) |
| `tickets` | Individual tickets purchased by users |
| `orders` | Payment orders |
| `favorites` | User bookmarked events |

**Security**: All tables have Row Level Security (RLS) enabled - users can only see/modify their own data!

---

## 🔥 Payment Integration

Supabase doesn't need Cloud Functions! Handle payments via Next.js API routes:

- **M-Pesa**: `app/api/payments/mpesa/route.ts`
- **PayPal**: `app/api/payments/paypal/route.ts`
- **Flutterwave**: `app/api/payments/flutterwave/route.ts`

Supabase webhooks can trigger on database changes (optional).

---

## 🆘 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### "Missing Supabase environment variables"
Make sure `.env.local` has all 3 Supabase variables set correctly.

### "new row violates row-level security policy"
Check RLS policies in Supabase Dashboard → Authentication → Policies

### Auth not working
1. Verify environment variables are loaded (restart dev server)
2. Check Supabase Dashboard → Authentication → Users to see if user was created
3. Check browser console for errors

---

## 📚 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Need help? Check the browser console and Supabase Dashboard logs!**
