import { NextResponse } from "next/server";
import { getSession, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await getCurrentUser();

  return NextResponse.json({
    authenticated: true,
    user: user
      ? {
          id: user.id,
          phone: user.phone,
          email: user.email,
          language: user.language,
          role: user.role,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          createdAt: user.created_at,
        }
      : null,
  });
}
