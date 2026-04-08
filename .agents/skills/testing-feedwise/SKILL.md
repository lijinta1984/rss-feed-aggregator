# Testing Feedwise RSS Aggregator

## Prerequisites

### Supabase Tables
The app requires database tables to exist in Supabase before any data features work. Run `supabase/schema.sql` in the Supabase SQL Editor. Without tables, subscriptions, articles, bookmarks, and AI summaries will all silently fail with 404 errors.

To verify tables exist:
```bash
curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/subscriptions?select=count" \
  -H "Prefer: count=exact"
```
If you get `PGRST205` error, tables don't exist.

### Email Confirmation
Supabase may have email confirmation enabled. Sign-up creates the user but auto-sign-in will fail because the email isn't verified. The sign-up page redirects to `/auth/login` instead of `/onboarding`.

**Workaround**: Use the admin API to confirm the test user:
```bash
# List users to get the user ID
curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users"

# Confirm the user's email
curl -s -X PUT "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users/{USER_ID}" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email_confirm": true}'
```

Alternatively, the user can disable "Confirm email" in Supabase Dashboard > Auth > Settings.

## Devin Secrets Needed
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for admin API and server-side operations)
- `ANTHROPIC_API_KEY` — Anthropic API key (for AI summaries)

## Running the Dev Server
```bash
cd /home/ubuntu/repos/rss-feed-aggregator
npm run dev
```
App runs at `http://localhost:3000`.

## Test Flows

### 1. Unauthenticated Explore
- Navigate to `/` — shows search input, "Sign in" and "Get Started" buttons
- Type 3+ chars in search — feed cards appear after 300ms debounce
- Click Follow on any card — auth modal appears

### 2. Sign Up + Onboarding
- Navigate to `/auth/signup` — enter email + password
- If email confirmation enabled, manually confirm via admin API, then login at `/auth/login`
- Navigate to `/onboarding` — select topics, click setup button
- Should redirect to `/inbox` with subscribed feeds in sidebar

### 3. Authenticated Features (require tables)
- Follow feeds from Explore page
- View articles in inbox
- Click article to open reader panel
- Bookmark articles
- Generate AI summaries
- Sidebar navigation (Today, All Articles, Saved, Explore)

## Common Issues
- **404 errors in console**: Supabase tables don't exist. Run `schema.sql`.
- **Follow button doesn't toggle**: Subscription insert failed — check tables and RLS policies.
- **Sign-up redirects to login**: Email confirmation is enabled. Use admin API workaround.
- **Onboarding doesn't subscribe feeds**: Check browser console for errors. Likely table or auth issue.
- **test.com emails rejected**: Supabase may reject certain email domains. Use realistic domains like gmail.com.
