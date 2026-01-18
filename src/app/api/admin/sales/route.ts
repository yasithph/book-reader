import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS, formatPhoneNumber, isValidSriLankanPhone } from "@/lib/textit/client";
import { getSession, getCurrentUser } from "@/lib/auth";

interface BookSelection {
  bookId: string;
  price: number;
}

interface SaleRequest {
  // Existing user
  userId?: string;
  // New user
  phone?: string;
  displayName?: string | null;
  // Products - either books or bundle
  books?: BookSelection[];
  bundleId?: string;
  amount?: number; // For bundle purchases
}

export async function POST(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();

    // Check if requesting user is admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body: SaleRequest = await request.json();
    const { userId, phone, displayName, books, bundleId, amount } = body;

    // Validate - need either userId or phone
    if (!userId && !phone) {
      return NextResponse.json(
        { error: "Either userId or phone is required" },
        { status: 400 }
      );
    }

    // Validate - need either books or bundleId
    if ((!books || books.length === 0) && !bundleId) {
      return NextResponse.json(
        { error: "Either books or bundleId is required" },
        { status: 400 }
      );
    }

    let targetUserId: string;
    let userPhone: string;
    let userName: string | null = null;
    let isNewUser = false;

    // Handle user lookup/creation
    if (userId) {
      // Existing user by ID
      const { data: existingUser, error: userError } = await adminSupabase
        .from("users")
        .select("id, phone, display_name")
        .eq("id", userId)
        .single();

      if (userError || !existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      targetUserId = existingUser.id;
      userPhone = existingUser.phone;
      userName = existingUser.display_name;
    } else {
      // New user by phone
      if (!isValidSriLankanPhone(phone!)) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 }
        );
      }

      const formattedPhone = formatPhoneNumber(phone!);
      userPhone = formattedPhone;
      userName = displayName || null;

      // Check if user already exists
      const { data: existingUser } = await adminSupabase
        .from("users")
        .select("id, phone, display_name")
        .eq("phone", formattedPhone)
        .single();

      if (existingUser) {
        targetUserId = existingUser.id;
        userName = existingUser.display_name || displayName || null;
      } else {
        // Create new user
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

        targetUserId = authUser.user.id;
        isNewUser = true;

        // Create user profile
        const { error: profileError } = await adminSupabase.from("users").insert({
          id: targetUserId,
          phone: formattedPhone,
          display_name: displayName,
          role: "user",
          is_first_login: true,
        });

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          await adminSupabase.auth.admin.deleteUser(targetUserId);
          return NextResponse.json(
            { error: "Failed to create user profile" },
            { status: 500 }
          );
        }
      }
    }

    // Handle purchase creation
    let responseItems: { title: string; price: number }[] = [];
    let totalAmount = 0;

    if (bundleId) {
      // Bundle purchase
      const { data: bundle, error: bundleError } = await adminSupabase
        .from("bundles")
        .select(`
          *,
          bundle_books (
            book_id,
            books (
              id,
              title_en,
              price_lkr
            )
          )
        `)
        .eq("id", bundleId)
        .single();

      if (bundleError || !bundle) {
        return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
      }

      const bundleBooks = bundle.bundle_books?.map((bb: any) => bb.books).filter(Boolean) || [];
      const purchaseGroupId = crypto.randomUUID();
      const saleAmount = amount || bundle.price_lkr;

      // Create a purchase record for each book in the bundle
      // Each record stores the full bundle amount (dedupe by purchase_group_id for income)
      for (const book of bundleBooks) {
        const { error: purchaseError } = await adminSupabase
          .from("purchases")
          .upsert({
            user_id: targetUserId,
            book_id: book.id,
            bundle_id: bundleId,
            purchase_group_id: purchaseGroupId,
            amount_lkr: saleAmount, // Full bundle amount in each record
            status: "approved",
            reviewed_by: adminUser.id,
            reviewed_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,book_id",
          });

        if (purchaseError) {
          console.error("Error creating purchase for book:", book.id, purchaseError);
        }
      }

      responseItems = [{ title: bundle.name_en, price: saleAmount }];
      totalAmount = saleAmount;
    } else if (books && books.length > 0) {
      // Individual book purchases
      const bookIds = books.map((b) => b.bookId);
      const { data: bookDetails, error: booksError } = await adminSupabase
        .from("books")
        .select("id, title_en")
        .in("id", bookIds);

      if (booksError || !bookDetails) {
        return NextResponse.json(
          { error: "Failed to validate books" },
          { status: 500 }
        );
      }

      // Create purchases for each book
      for (const book of books) {
        const { error: purchaseError } = await adminSupabase
          .from("purchases")
          .upsert({
            user_id: targetUserId,
            book_id: book.bookId,
            amount_lkr: book.price,
            status: "approved",
            reviewed_by: adminUser.id,
            reviewed_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,book_id",
          });

        if (purchaseError) {
          console.error("Error creating purchase:", purchaseError);
        }
      }

      responseItems = books.map((b) => {
        const detail = bookDetails.find((d) => d.id === b.bookId);
        return {
          title: detail?.title_en || "Unknown",
          price: b.price,
        };
      });

      totalAmount = books.reduce((sum, b) => sum + b.price, 0);
    }

    // Send SMS notification
    let smsSent = false;
    try {
      const itemTitles = responseItems.map((i) => i.title).join(", ");
      const smsMessage = isNewUser
        ? `Welcome to Book Reader! Your account has been created. You can now access: ${itemTitles}. Login at: ${process.env.NEXT_PUBLIC_APP_URL || "https://bookreader.lk"}/auth`
        : `Your Book Reader library has been updated! New items added: ${itemTitles}. Open the app to start reading.`;

      await sendSMS({
        to: userPhone,
        text: smsMessage,
      });
      smsSent = true;
    } catch (smsError) {
      console.error("Error sending SMS:", smsError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: targetUserId,
        phone: userPhone,
        display_name: userName,
        isNew: isNewUser,
      },
      items: responseItems,
      total: totalAmount,
      smsSent,
    });
  } catch (error) {
    console.error("Error in sales route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
