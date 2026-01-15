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
          language: user.language,
          role: user.role,
          createdAt: user.created_at,
        }
      : null,
  });
}
