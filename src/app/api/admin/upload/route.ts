import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

// Bucket configuration
const BUCKETS = {
  cover: "book-covers",
  chapter: "chapter-images",
} as const;

type UploadType = keyof typeof BUCKETS;

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    // Check admin role
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uploadType = (formData.get("type") as UploadType) || "cover";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate upload type
    if (!BUCKETS[uploadType]) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 10MB" }, { status: 400 });
    }

    // Generate unique filename with appropriate prefix
    const fileExt = file.name.split(".").pop() || "jpg";
    const prefix = uploadType === "cover" ? "covers" : "chapters";
    const fileName = `${prefix}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const bucketName = BUCKETS[uploadType];

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage using admin client
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: `Failed to upload: ${error.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = adminSupabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
