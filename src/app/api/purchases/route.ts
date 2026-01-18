import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const bookId = formData.get("bookId") as string;
    const bundleId = formData.get("bundleId") as string;
    const amount = formData.get("amount") as string;
    const paymentReference = formData.get("paymentReference") as string;
    const proofFile = formData.get("proofFile") as File;

    // Need either bookId or bundleId
    if ((!bookId && !bundleId) || !amount || !proofFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Handle bundle purchase
    if (bundleId) {
      // Check if user already has a pending/approved purchase for this bundle
      const { data: existingBundle } = await supabase
        .from("purchases")
        .select("id, status")
        .eq("user_id", session.userId)
        .eq("bundle_id", bundleId)
        .limit(1);

      const existingBundlePurchase = existingBundle?.[0];

      if (existingBundlePurchase?.status === "approved") {
        return NextResponse.json(
          { error: "You already own this bundle" },
          { status: 400 }
        );
      }

      if (existingBundlePurchase?.status === "pending") {
        return NextResponse.json(
          { error: "You already have a pending purchase request for this bundle" },
          { status: 400 }
        );
      }

      // Get bundle with its books
      const { data: bundle, error: bundleError } = await supabase
        .from("bundles")
        .select(`
          id,
          price_lkr,
          bundle_books (
            book_id
          )
        `)
        .eq("id", bundleId)
        .eq("is_active", true)
        .single();

      if (bundleError || !bundle) {
        return NextResponse.json(
          { error: "Bundle not found" },
          { status: 404 }
        );
      }

      // Upload proof file
      const fileExt = proofFile.name.split(".").pop();
      const fileName = `${session.userId}/bundle-${bundleId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, proofFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload payment proof" },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(uploadData.path);

      // Generate a purchase group ID for all books in bundle
      const purchaseGroupId = crypto.randomUUID();

      // Create purchase records for each book in the bundle
      // Each record stores the full bundle amount (dedupe by purchase_group_id for income)
      const bookIds = bundle.bundle_books?.map((bb: any) => bb.book_id) || [];
      const bundleAmount = parseFloat(amount);
      const purchaseRecords = bookIds.map((bookId: string) => ({
        user_id: session.userId,
        book_id: bookId,
        bundle_id: bundleId,
        purchase_group_id: purchaseGroupId,
        amount_lkr: bundleAmount, // Full bundle amount in each record
        payment_reference: paymentReference || null,
        payment_proof_url: urlData.publicUrl,
        status: "pending",
      }));

      const { data, error } = await supabase
        .from("purchases")
        .insert(purchaseRecords)
        .select();

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json(
          { error: "Failed to create purchase request" },
          { status: 500 }
        );
      }

      return NextResponse.json({ purchases: data });
    }

    // Handle single book purchase
    // Check if user already has a pending/approved purchase
    const { data: existing } = await supabase
      .from("purchases")
      .select("id, status")
      .eq("user_id", session.userId)
      .eq("book_id", bookId)
      .single();

    if (existing?.status === "approved") {
      return NextResponse.json(
        { error: "You already own this book" },
        { status: 400 }
      );
    }

    if (existing?.status === "pending") {
      return NextResponse.json(
        { error: "You already have a pending purchase request" },
        { status: 400 }
      );
    }

    // Upload proof file to Supabase Storage
    const fileExt = proofFile.name.split(".").pop();
    const fileName = `${session.userId}/${bookId}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, proofFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload payment proof" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(uploadData.path);

    // Create or update purchase record
    if (existing?.status === "rejected") {
      // Update rejected purchase
      const { data, error } = await supabase
        .from("purchases")
        .update({
          amount_lkr: parseFloat(amount),
          payment_reference: paymentReference || null,
          payment_proof_url: urlData.publicUrl,
          status: "pending",
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
        return NextResponse.json(
          { error: "Failed to update purchase request" },
          { status: 500 }
        );
      }

      return NextResponse.json({ purchase: data });
    } else {
      // Create new purchase
      const { data, error } = await supabase
        .from("purchases")
        .insert({
          user_id: session.userId,
          book_id: bookId,
          amount_lkr: parseFloat(amount),
          payment_reference: paymentReference || null,
          payment_proof_url: urlData.publicUrl,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json(
          { error: "Failed to create purchase request" },
          { status: 500 }
        );
      }

      return NextResponse.json({ purchase: data });
    }
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("purchases")
    .select(`
      *,
      books (
        id,
        title_en,
        title_si,
        cover_image_url
      )
    `)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }

  return NextResponse.json({ purchases: data });
}
