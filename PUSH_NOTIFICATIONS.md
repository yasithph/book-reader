# Push Notifications Implementation

This document describes the push notification system for sending chapter updates to users who have purchased books.

## Features

- ✅ Push notifications sent when new chapters are published
- ✅ Notifications sent in the user's preferred language (English or Sinhala)
- ✅ Only sent to users who have purchased the book
- ✅ Chapter name shown if available, otherwise chapter number
- ✅ User can enable/disable notifications in settings
- ✅ Works on PWA (installed apps) and modern browsers

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file (or hosting environment):

```bash
# Public VAPID key (safe to expose to clients)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BCcVuTYk2miLBfGu5asZKZ9z91yiultpIcFE5zBM2GvefaS6Qj8n6rfaKAyLfc50ZZgaQdJAkCtfMEh76b3rGiA

# Private VAPID key (keep secret!)
VAPID_PRIVATE_KEY=o7WxqSoeYkekNPWQob29IzhaTyFhLonptjJ5QWRs7jI

# Email for VAPID subject (your contact email)
VAPID_SUBJECT=mailto:admin@bookreader.com
```

**Important**: The keys above are examples generated for this project. For production, you can generate new keys with:

```bash
npx web-push generate-vapid-keys
```

### 2. Database Migration

Run the migration to create the `push_subscriptions` table:

```bash
# Apply migration 007_push_subscriptions.sql
# This creates the push_subscriptions table with proper indexes and RLS policies
```

### 3. Install Dependencies

The `web-push` library is already installed. If needed:

```bash
npm install web-push
```

## How It Works

### User Flow

1. **User visits the app** → After 15 seconds, a prompt appears asking to enable notifications
2. **User enables notifications** → Browser requests permission, subscription saved to database
3. **Admin publishes a chapter** → System identifies users who purchased the book
4. **Notifications sent** → Each user receives a notification in their preferred language
5. **User clicks notification** → Opens the chapter in the reader

### Admin Flow

1. **Admin creates/publishes a chapter** via:
   - `POST /api/admin/chapters` (new chapter)
   - `POST /api/admin/chapters/[chapterId]` (publish draft)
2. **System automatically**:
   - Queries users who purchased the book
   - Gets each user's language preference
   - Formats notification in their language
   - Sends push notification via Web Push API

### Technical Flow

```
Chapter Created
    ↓
Get Book Details (title_en, title_si)
    ↓
Query Purchases (WHERE book_id = X AND status = 'approved')
    ↓
For each user:
    ↓
    Get user's language_preference
    ↓
    Get user's push subscriptions
    ↓
    Format notification (title, body, URL)
    ↓
    Send via Web Push API
```

## Notification Format

### English Notification
```
Title: "New Chapter Available!"
Body: "[Book Title] - Chapter 5: The Beginning"
```

### Sinhala Notification
```
Title: "නව පරිච්ඡේදයක්!"
Body: "[පොත් නම] - පරිච්ඡේදය 5"
```

If chapter has no title, it shows:
- English: "Chapter 5"
- Sinhala: "පරිච්ඡේදය 5"

## Browser Support

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Edge | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Safari | ✅ (16.4+) | ✅ (16.4+) | Requires PWA install on iOS |
| Opera | ✅ | ✅ | Full support |

**iOS Limitation**: Push notifications only work when the PWA is installed ("Add to Home Screen"). They don't work in Safari browser.

## Database Schema

### push_subscriptions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| endpoint | TEXT | Push subscription endpoint (unique) |
| keys_p256dh | TEXT | Encryption key (p256dh) |
| keys_auth | TEXT | Authentication secret |
| notifications_enabled | BOOLEAN | User preference toggle |
| user_agent | TEXT | Browser user agent |
| created_at | TIMESTAMPTZ | Subscription creation time |
| updated_at | TIMESTAMPTZ | Last updated |
| last_used_at | TIMESTAMPTZ | Last notification sent |

### Indexes
- `idx_push_subscriptions_user` - Fast user lookups
- `idx_push_subscriptions_enabled` - Filter enabled subscriptions

## API Endpoints

### User Endpoints

**GET /api/user/push-subscriptions**
- Returns user's push subscriptions
- Requires authentication

**POST /api/user/push-subscriptions**
- Saves a new push subscription
- Payload: `{ endpoint, keys: { p256dh, auth }, userAgent }`
- Upserts (insert or update)

**DELETE /api/user/push-subscriptions?endpoint=[URL]**
- Removes a push subscription
- Query param: `endpoint` (URL-encoded)

### Admin Endpoints

Push notifications are triggered automatically in:
- `POST /api/admin/chapters` - Creating new chapters
- `POST /api/admin/chapters/[chapterId]` - Publishing draft chapters

## Security

### VAPID Keys
- Public key: Safe to expose in client-side code
- Private key: **Never expose**, server-side only
- Subject: Your contact email for accountability

### Row Level Security (RLS)
- Users can only view/manage their own subscriptions
- Admins can view all subscriptions (for sending notifications)
- Users cannot view other users' subscriptions

### Subscription Cleanup
- Expired/invalid subscriptions (410/404 status) are automatically deleted
- Prevents database bloat from old subscriptions

## Troubleshooting

### Notifications Not Sending

1. **Check environment variables**:
   ```bash
   echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
   echo $VAPID_PRIVATE_KEY
   ```

2. **Check browser console** for subscription errors

3. **Verify database**:
   ```sql
   SELECT * FROM push_subscriptions WHERE user_id = '[USER_ID]';
   ```

4. **Check server logs** for Web Push API errors

### Permission Denied

- User must grant notification permission in browser
- On iOS, PWA must be installed first
- Check browser settings → Site settings → Notifications

### Notifications Not Appearing

- Verify service worker is registered
- Check browser's notification settings
- Ensure notifications aren't blocked for the site
- iOS: Ensure app is installed, not just bookmarked

## Testing

### Manual Testing

1. **Subscribe to notifications** in Settings page
2. **Create a test purchase** for a book
3. **Publish a new chapter** as admin
4. **Check notifications** appear on your device

### Check Subscription Status

```javascript
// In browser console
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub);
  });
});
```

## Files Changed/Created

### New Files
- `supabase/migrations/007_push_subscriptions.sql` - Database schema
- `src/app/api/user/push-subscriptions/route.ts` - Subscription API
- `src/hooks/use-push-notifications.ts` - React hook
- `src/components/pwa/push-notification-prompt.tsx` - UI prompt
- `src/lib/push-notifications/index.ts` - Server-side utilities
- `.env.example` - Environment variable template
- `PUSH_NOTIFICATIONS.md` - This documentation

### Modified Files
- `public/sw.js` - Enhanced push event handler
- `src/app/api/admin/chapters/route.ts` - Integrated notifications
- `src/app/api/admin/chapters/[chapterId]/route.ts` - Integrated notifications
- `src/app/(authenticated)/settings/page.tsx` - Added notification toggle
- `src/components/pwa/pwa-provider.tsx` - Added prompt component
- `src/components/pwa/index.ts` - Export new component
- `src/hooks/index.ts` - Export new hook
- `src/styles/kindle.css` - Notification UI styles

## Future Enhancements

- [ ] Notification history page
- [ ] Different notification types (sales, announcements)
- [ ] Scheduled notifications
- [ ] Notification analytics
- [ ] Push notification testing UI for admins
- [ ] Bulk notification sending
