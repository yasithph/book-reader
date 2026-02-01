import { sendEmail } from "./client";

interface NotificationItem {
  title: string;
  price: number;
}

/**
 * Send welcome email to new users created via admin sale
 */
export async function sendWelcomeEmail(
  email: string,
  items: NotificationItem[],
  appUrl: string
): Promise<{ success: boolean; error?: string }> {
  const itemList = items.map((i) => i.title).join(", ");

  const result = await sendEmail({
    to: email,
    subject: "Welcome to Meera!",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:32px 24px;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">Welcome to Meera!</h1>
        <p style="margin:0 0 16px;font-size:14px;color:#666;">Meera වෙත සාදරයෙන් පිළිගනිමු!</p>
        <p style="margin:0 0 16px;font-size:14px;color:#333;">
          Your account has been created. You can now access:
        </p>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:0 0 24px;text-align:left;">
          ${items.map((i) => `<div style="padding:4px 0;font-size:14px;color:#1a1a1a;">&bull; ${i.title}</div>`).join("")}
        </div>
        <a href="${appUrl}/auth" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
          Sign In to Start Reading
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`.trim(),
    text: `Welcome to Meera! Your account has been created. You can now access: ${itemList}. Login at: ${appUrl}/auth`,
  });

  return { success: result.success, error: result.error };
}

/**
 * Send library update email for existing users via admin sale
 */
export async function sendLibraryUpdateEmail(
  email: string,
  items: NotificationItem[]
): Promise<{ success: boolean; error?: string }> {
  const itemList = items.map((i) => i.title).join(", ");

  const result = await sendEmail({
    to: email,
    subject: "Your library has been updated!",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:32px 24px;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">Library Updated!</h1>
        <p style="margin:0 0 16px;font-size:14px;color:#666;">ඔබේ පුස්තකාලය යාවත්කාලීන කර ඇත!</p>
        <p style="margin:0 0 16px;font-size:14px;color:#333;">
          New items have been added to your library:
        </p>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:0 0 24px;text-align:left;">
          ${items.map((i) => `<div style="padding:4px 0;font-size:14px;color:#1a1a1a;">&bull; ${i.title}</div>`).join("")}
        </div>
        <p style="margin:0;font-size:14px;color:#888;">Open the app to start reading.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim(),
    text: `Your Meera library has been updated! New items added: ${itemList}. Open the app to start reading.`,
  });

  return { success: result.success, error: result.error };
}
