import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("language_preference, reader_theme, font_size, line_spacing, is_first_login")
    .eq("id", session.userId)
    .single();

  if (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json({ preferences: data });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    language_preference,
    reader_theme,
    font_size,
    line_spacing,
    is_first_login,
  } = body;

  const supabase = await createClient();

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (language_preference !== undefined) updateData.language_preference = language_preference;
  if (reader_theme !== undefined) updateData.reader_theme = reader_theme;
  if (font_size !== undefined) updateData.font_size = font_size;
  if (line_spacing !== undefined) updateData.line_spacing = line_spacing;
  if (is_first_login !== undefined) updateData.is_first_login = is_first_login;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", session.userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json({ preferences: data });
}
