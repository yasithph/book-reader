import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configure VAPID details for web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@bookreader.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushSubscriptionData {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  notifications_enabled: boolean;
}

interface ChapterNotificationData {
  bookId: string;
  bookTitleEn: string;
  bookTitleSi: string;
  chapterNumber: number;
  chapterTitleEn?: string;
  chapterTitleSi?: string;
}

/**
 * Send push notification to a specific user
 * @param userId - The user ID to send notification to
 * @param data - The notification data
 * @param language - The user's language preference ('en' or 'si')
 */
export async function sendPushNotificationToUser(
  userId: string,
  data: ChapterNotificationData,
  language: "en" | "si" = "si"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("notifications_enabled", true);

    if (fetchError) {
      console.error("Error fetching push subscriptions:", fetchError);
      return { success: false, error: "Failed to fetch subscriptions" };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true }; // No subscriptions, but not an error
    }

    // Format notification based on language
    const { title, body } = formatChapterNotification(data, language);

    const payload = JSON.stringify({
      title,
      body,
      bookId: data.bookId,
      chapterNumber: data.chapterNumber,
      url: `/read/${data.bookId}/${data.chapterNumber}`,
    });

    // Send notification to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscriptionData) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys_p256dh,
            auth: sub.keys_auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);

          // Update last_used_at
          await supabase
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);

          return { success: true };
        } catch (error: unknown) {
          // Handle expired/invalid subscriptions
          if (
            error &&
            typeof error === "object" &&
            "statusCode" in error &&
            (error.statusCode === 410 || error.statusCode === 404)
          ) {
            // Subscription expired or invalid, remove it
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }
          throw error;
        }
      })
    );

    // Check if at least one notification was sent successfully
    const successCount = results.filter(
      (r) => r.status === "fulfilled"
    ).length;

    return { success: successCount > 0 };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send push notifications to all users who purchased a specific book
 * @param bookId - The book ID
 * @param data - The chapter notification data
 */
export async function sendChapterNotificationToBookPurchasers(
  bookId: string,
  data: ChapterNotificationData
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  try {
    const supabase = createAdminClient();

    // Get all users who purchased this book (approved purchases only)
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("user_id, users!inner(id, language_preference)")
      .eq("book_id", bookId)
      .eq("status", "approved");

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError);
      return { success: false, sentCount: 0, errors: [String(purchasesError)] };
    }

    if (!purchases || purchases.length === 0) {
      return { success: true, sentCount: 0, errors: [] }; // No purchasers
    }

    // Send notifications to all purchasers
    const results = await Promise.allSettled(
      purchases.map(async (purchase) => {
        // Supabase returns users as object when using !inner join
        const user = purchase.users as unknown as { id: string; language_preference: "en" | "si" };
        return sendPushNotificationToUser(
          user.id,
          data,
          user.language_preference || "si"
        );
      })
    );

    // Count successes and collect errors
    let sentCount = 0;
    const errors: string[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.success) {
        sentCount++;
      } else if (result.status === "rejected") {
        errors.push(String(result.reason));
      } else if (result.status === "fulfilled" && result.value.error) {
        errors.push(result.value.error);
      }
    });

    return { success: sentCount > 0, sentCount, errors };
  } catch (error) {
    console.error("Error sending chapter notifications:", error);
    return { success: false, sentCount: 0, errors: [String(error)] };
  }
}

/**
 * Format chapter notification based on language preference
 */
function formatChapterNotification(
  data: ChapterNotificationData,
  language: "en" | "si"
): { title: string; body: string } {
  const bookTitle = language === "en" ? data.bookTitleEn : data.bookTitleSi;
  const chapterTitle =
    language === "en" ? data.chapterTitleEn : data.chapterTitleSi;

  // Use chapter title if available, otherwise use chapter number
  const chapterLabel = chapterTitle
    ? chapterTitle
    : language === "en"
    ? `Chapter ${data.chapterNumber}`
    : `පරිච්ඡේදය ${data.chapterNumber}`;

  const title = language === "en" ? "New Chapter Available!" : "නව පරිච්ඡේදයක්!";

  const body = `${bookTitle} - ${chapterLabel}`;

  return { title, body };
}
