# Testing Feedwise RSS Aggregator

## Devin Secrets Needed
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for admin operations)
- `ANTHROPIC_API_KEY` — Anthropic Claude API key (for AI summaries)

## Prerequisites
1. **Supabase tables must exist** — Run `supabase/schema.sql` in the Supabase SQL Editor before testing. Without tables, all data-dependent features (subscriptions, articles, bookmarks, summaries) will fail with PGRST205 errors.
2. **Profile trigger** — The schema includes a trigger `on_auth_user_created` that auto-creates a profile row when a new user signs up. If a user was created before the trigger existed, manually insert a profile via the REST API:
   ```bash
   curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"id": "<user-uuid>", "email": "<email>"}'
   ```
3. **Email confirmation** — Supabase may have email confirmation enabled. To bypass for testing, use the admin API to confirm a user:
   ```bash
   curl -X PUT "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users/<user-id>" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email_confirm": true}'
   ```

## Running the Dev Server
```bash
cd /home/ubuntu/repos/rss-feed-aggregator
npm run dev
# Server runs at http://localhost:3000
```

## Database Connection Notes
- The Supabase direct DB host (`db.<ref>.supabase.co`) may only resolve to IPv6, which might be unreachable from some VMs
- The Supabase pooler (`aws-0-<region>.pooler.supabase.com`) requires the **database password** (set during project creation), NOT the service role key or dashboard login password
- If you can't connect via psql, ask the user to run SQL via the Supabase Dashboard SQL Editor

## Golden-Path Test Flow
1. **Explore page** — Navigate to `/`, verify search input and heading render
2. **Feed discovery** — Type a topic (e.g., "technology"), wait for debounced results (300ms)
3. **Follow feed** — Click "Follow" on a result card, verify button toggles to "Following ✓" and feed appears in sidebar
4. **Inbox** — Navigate to Today/All Articles, verify article cards with titles, excerpts, timestamps
5. **Reader panel** — Click article card, verify slide-over panel with title, content, close button. Test Escape key to close.
6. **Mark as read** — Opening an article decrements unread count. "Mark all as read" clears all.
7. **Bookmark** — Click bookmark icon, verify it fills blue. Navigate to Saved, verify article appears.
8. **AI Summary** — Click "Summarize" on article card, verify 3 bullet points appear in blue box. Button changes to "Hide Summary".
9. **Onboarding** — Navigate to `/onboarding`, select topic chips, click setup. Verify auto-subscription to 3 feeds per topic, redirect to inbox.
10. **Sidebar filtering** — Click a feed name in sidebar, verify inbox filters to that feed only.

## Auth Architecture
- Client-side Supabase JS SDK stores sessions in `localStorage` (not cookies)
- API routes validate auth via `Authorization: Bearer <token>` header
- Server validates with `supabase.auth.getUser(token)` using service role client
- Unauthenticated follow attempts show an auth modal

## Common Issues
- **PGRST205 errors** — Tables don't exist. Run `supabase/schema.sql`.
- **"Tenant or user not found" on psql** — Wrong password. Need the database password, not service role key.
- **Sign-up redirects to login instead of onboarding** — Email confirmation is enabled. Disable in Supabase Auth settings or use admin API to confirm.
- **No articles after following** — Article fetch is async. Wait a few seconds or refresh the page.
