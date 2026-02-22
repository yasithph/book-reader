import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check if requesting user is admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { searchParams } = request.nextUrl;
    const page = searchParams.get("page");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search")?.trim() || "";
    const dateFilter = searchParams.get("dateFilter") || "all";

    // When page is provided, return paginated results
    if (page) {
      const pageNum = parseInt(page, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        return NextResponse.json({ error: "Invalid page" }, { status: 400 });
      }
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
      }
      const offset = (pageNum - 1) * limit;

      let query = supabase
        .from("users")
        .select(
          `
          id,
          phone,
          email,
          display_name,
          avatar_url,
          created_at,
          last_active_at,
          purchases:purchases!purchases_user_id_fkey (
            status,
            amount_lkr,
            purchase_group_id,
            bundle_id,
            book:books (
              id,
              title_en
            )
          )
        `,
          { count: "exact" }
        )
        .eq("role", "user");

      // Apply search filter
      if (search) {
        // Sanitize search to prevent PostgREST filter injection
        // Remove commas, parens, and dots that could be interpreted as filter syntax
        const sanitized = search.replace(/[,().]/g, "");
        if (sanitized) {
          query = query.or(
            `display_name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,email.ilike.%${sanitized}%`
          );
        }
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        let filterDate: Date;
        switch (dateFilter) {
          case "today":
            filterDate = startOfToday;
            break;
          case "yesterday": {
            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            filterDate = startOfYesterday;
            // For "yesterday", also add an upper bound
            query = query.lt("created_at", startOfToday.toISOString());
            break;
          }
          case "7d": {
            const weekAgo = new Date(startOfToday);
            weekAgo.setDate(weekAgo.getDate() - 7);
            filterDate = weekAgo;
            break;
          }
          case "30d": {
            const monthAgo = new Date(startOfToday);
            monthAgo.setDate(monthAgo.getDate() - 30);
            filterDate = monthAgo;
            break;
          }
          default:
            filterDate = new Date(0);
        }
        query = query.gte("created_at", filterDate.toISOString());
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: users, error, count } = await query;

      if (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
          { error: "Failed to fetch users" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        users: users || [],
        total: count || 0,
        page: pageNum,
        limit,
      });
    }

    // No pagination — return all users (backward-compatible for sales page)
    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        phone,
        email,
        display_name,
        avatar_url,
        created_at,
        last_active_at,
        purchases:purchases!purchases_user_id_fkey (
          status,
          amount_lkr,
          purchase_group_id,
          bundle_id,
          book:books (
            id,
            title_en
          )
        )
      `
      )
      .eq("role", "user")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Error in users GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
