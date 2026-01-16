import { redirect } from "next/navigation";

// Redirect /books to home page
export default function BooksPage() {
  redirect("/");
}
