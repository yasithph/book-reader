import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Session {
  userId: string;
  phone?: string;
  email?: string;
}

/**
 * Get the current session from cookies
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;
  const phone = cookieStore.get("session_phone")?.value;
  const email = cookieStore.get("session_email")?.value;

  // User must have userId and at least one identifier (phone or email)
  if (!userId || (!phone && !email)) {
    return null;
  }

  return {
    userId,
    ...(phone && { phone }),
    ...(email && { email }),
  };
}

/**
 * Get session or redirect to auth page
 * Use this in protected pages/layouts
 */
export async function requireSession(redirectUrl?: string): Promise<Session> {
  const session = await getSession();

  if (!session) {
    const redirectPath = redirectUrl
      ? `/auth?redirect=${encodeURIComponent(redirectUrl)}`
      : "/auth";
    redirect(redirectPath);
  }

  return session;
}

/**
 * Get the current user from the database
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.userId)
    .single();

  return user;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

/**
 * Require admin role or redirect
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  const admin = await isAdmin();

  if (!admin) {
    redirect("/library");
  }

  return session;
}
