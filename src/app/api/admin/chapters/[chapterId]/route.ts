import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Helper to check admin
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user, userData };
}

// Count words in text
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

// Estimate reading time (avg 200 words per minute for Sinhala)
function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

interface RouteParams {
  params: Promise<{ chapterId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { chapterId } = await params;
    const supabase = await createClient();

    const { data: chapter, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", chapterId)
      .single();

    if (error || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error in admin chapters GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { chapterId } = await params;
    const body = await request.json();
    const {
      chapter_number,
      title_en,
      title_si,
      content,
    } = body;

    // Validate required fields
    if (!chapter_number || !content) {
      return NextResponse.json(
        { error: "Chapter number and content are required" },
        { status: 400 }
      );
    }

    const wordCount = countWords(content);
    const readingTime = estimateReadingTime(wordCount);

    const supabase = createAdminClient();
    const { data: chapter, error } = await supabase
      .from("chapters")
      .update({
        chapter_number,
        title_en: title_en || null,
        title_si: title_si || null,
        content,
        word_count: wordCount,
        estimated_reading_time: readingTime,
      })
      .eq("id", chapterId)
      .select()
      .single();

    if (error) {
      console.error("Error updating chapter:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Chapter number already exists for this book" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error in admin chapters PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { chapterId } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("chapters")
      .delete()
      .eq("id", chapterId);

    if (error) {
      console.error("Error deleting chapter:", error);
      return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin chapters DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
