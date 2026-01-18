import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { BundlePurchaseForm } from "./bundle-purchase-form";

interface BundlePurchasePageProps {
  params: Promise<{ bundleId: string }>;
}

interface BundleBook {
  id: string;
  title_en: string;
  title_si: string;
  cover_image_url: string | null;
  price_lkr: number;
}

interface Bundle {
  id: string;
  name_en: string;
  name_si: string | null;
  description_en: string | null;
  price_lkr: number;
  books: BundleBook[];
  original_price: number;
  savings: number;
}

async function getBundle(bundleId: string): Promise<Bundle | null> {
  const supabase = await createClient();

  const { data: bundle, error } = await supabase
    .from("bundles")
    .select(`
      id,
      name_en,
      name_si,
      description_en,
      price_lkr,
      bundle_books (
        books (
          id,
          title_en,
          title_si,
          cover_image_url,
          price_lkr,
          is_published
        )
      )
    `)
    .eq("id", bundleId)
    .eq("is_active", true)
    .single();

  if (error || !bundle) {
    return null;
  }

  const books = bundle.bundle_books
    ?.map((bb: any) => bb.books)
    .filter((book: any) => book && book.is_published) || [];

  const originalPrice = books.reduce((sum: number, book: any) => sum + (book?.price_lkr || 0), 0);

  return {
    id: bundle.id,
    name_en: bundle.name_en,
    name_si: bundle.name_si,
    description_en: bundle.description_en,
    price_lkr: bundle.price_lkr,
    books,
    original_price: originalPrice,
    savings: originalPrice - bundle.price_lkr,
  };
}

async function checkExistingBundlePurchase(userId: string, bundleId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("purchases")
    .select("id, status")
    .eq("user_id", userId)
    .eq("bundle_id", bundleId)
    .limit(1);

  // Return the first matching purchase (if any)
  return data?.[0] || null;
}

export async function generateMetadata({ params }: BundlePurchasePageProps) {
  const { bundleId } = await params;
  const bundle = await getBundle(bundleId);

  if (!bundle) {
    return { title: "Bundle Not Found" };
  }

  return {
    title: `Purchase ${bundle.name_si || bundle.name_en}`,
    description: `Purchase ${bundle.name_en} - ${bundle.books.length} books`,
  };
}

export default async function BundlePurchasePage({ params }: BundlePurchasePageProps) {
  const { bundleId } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/auth?redirect=/purchase/bundle/${bundleId}`);
  }

  const bundle = await getBundle(bundleId);

  if (!bundle) {
    notFound();
  }

  // Check for existing purchase
  const existingPurchase = await checkExistingBundlePurchase(session.userId, bundleId);

  if (existingPurchase?.status === "approved") {
    redirect(`/library`);
  }

  return (
    <BundlePurchaseForm
      bundle={bundle}
      existingPurchase={existingPurchase}
    />
  );
}
