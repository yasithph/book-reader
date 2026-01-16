import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import type { Book } from "@/types";
import { PurchaseForm } from "./purchase-form";

interface PurchasePageProps {
  params: Promise<{ bookId: string }>;
}

async function getBook(bookId: string): Promise<Book | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data;
}

async function checkExistingPurchase(userId: string, bookId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("purchases")
    .select("id, status")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .single();

  return data;
}

export async function generateMetadata({ params }: PurchasePageProps) {
  const { bookId } = await params;
  const book = await getBook(bookId);

  if (!book) {
    return { title: "Book Not Found" };
  }

  return {
    title: `Purchase ${book.title_en}`,
    description: `Purchase ${book.title_en} - ${book.title_si}`,
  };
}

export default async function PurchasePage({ params }: PurchasePageProps) {
  const { bookId } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/auth?redirect=/purchase/${bookId}`);
  }

  const book = await getBook(bookId);

  if (!book) {
    notFound();
  }

  // Check if book is free
  if (book.is_free) {
    redirect(`/books/${bookId}`);
  }

  // Check for existing purchase
  const existingPurchase = await checkExistingPurchase(session.userId, bookId);

  if (existingPurchase?.status === "approved") {
    redirect(`/library`);
  }

  return (
    <PurchaseForm
      book={book}
      existingPurchase={existingPurchase}
    />
  );
}
