import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS, formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit/client";
import { getSession, getCurrentUser } from "@/lib/auth";

interface BookSelection {
  bookId: string;
  price: number;
}

interface RegisterRequest {
  phone: string;
  displayName: string | null;
  books: BookSelection[];
}

export async function POST(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();

    // Check if requesting user is admin using session-based auth
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body: RegisterRequest = await request.json();
    const { phone, displayName, books } = body;

    // Validate phone
    if (!phone || !isValidSriLankanPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Validate books
    if (!books || books.length === 0) {
      return NextResponse.json(
        { error: "At least one book is required" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Check if user already exists
    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("id, phone")
      .eq("phone", formattedPhone)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // User exists, use their ID
      userId = existingUser.id;
    } else {
      // Create new user in auth
      const { data: authUser, error: authError } =
        await adminSupabase.auth.admin.createUser({
          phone: formattedPhone,
          phone_confirm: true,
          user_metadata: {
            display_name: displayName,
          },
        });

      if (authError || !authUser.user) {
        console.error("Error creating auth user:", authError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      userId = authUser.user.id;
      isNewUser = true;

      // Create user profile
      const { error: profileError } = await adminSupabase.from("users").insert({
        id: userId,
        phone: formattedPhone,
        display_name: displayName,
        role: "user",
        is_first_login: true,
      });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        // Try to clean up auth user
        await adminSupabase.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
    }

    // Get book details for response and validation
    const bookIds = books.map((b) => b.bookId);
    const { data: bookDetails, error: booksError } = await adminSupabase
      .from("books")
      .select("id, title_en, title_si")
      .in("id", bookIds);

    if (booksError || !bookDetails) {
      console.error("Error fetching book details:", booksError);
      return NextResponse.json(
        { error: "Failed to validate books" },
        { status: 500 }
      );
    }

    // Create purchases for each book
    const purchaseRecords = books.map((book) => ({
      user_id: userId,
      book_id: book.bookId,
      amount_lkr: book.price,
      status: "approved" as const,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    }));

    // Insert purchases (upsert to handle re-registration)
    for (const purchase of purchaseRecords) {
      const { error: purchaseError } = await adminSupabase
        .from("purchases")
        .upsert(purchase, {
          onConflict: "user_id,book_id",
        });

      if (purchaseError) {
        console.error("Error creating purchase:", purchaseError);
        // Continue with other purchases
      }
    }

    // Calculate total
    const total = books.reduce((sum, b) => sum + b.price, 0);

    // Prepare response data
    const responseBooks = books.map((b) => {
      const detail = bookDetails.find((d) => d.id === b.bookId);
      return {
        title: detail?.title_en || "Unknown",
        price: b.price,
      };
    });

    // Send SMS notification
    let smsSent = false;
    try {
      const bookTitles = responseBooks.map((b) => b.title).join(", ");
      const smsMessage = isNewUser
        ? `Welcome to Meera! Your account has been created. You can now access: ${bookTitles}. Login at: ${process.env.NEXT_PUBLIC_APP_URL || "https://bookreader.lk"}/auth`
        : `Your Meera library has been updated! New books added: ${bookTitles}. Open the app to start reading.`;

      await sendSMS({
        to: formattedPhone,
        text: smsMessage,
      });
      smsSent = true;
    } catch (smsError) {
      console.error("Error sending SMS:", smsError);
      // Don't fail the request if SMS fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        phone: formattedPhone,
        display_name: displayName,
        isNew: isNewUser,
      },
      books: responseBooks,
      total,
      smsSent,
    });
  } catch (error) {
    console.error("Error in register-user route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
