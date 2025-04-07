import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { linkId } = await req.json();

    if (!linkId) {
      return NextResponse.json({ error: "Missing required field: linkId" }, { status: 400 });
    }

    const supabase = createServerActionClient({ cookies });

    const { data: link, error } = await supabase
      .from("links")
      .select("id, destination_url")
      .eq("id", linkId)
      .single();

    if (error || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const edgeRes = await fetch("https://ytzpkzovcxaelwlzuigc.functions.supabase.co/check-broken-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({
        url: link.destination_url,
        linkId: link.id, // <-- this is what was missing
      }),
    });

    if (!edgeRes.ok) {
      const text = await edgeRes.text();
      return NextResponse.json({ error: "Edge function failed", details: text }, { status: 500 });
    }

    const result = await edgeRes.json();

    await supabase
      .from("links")
      .update({
        is_broken: result.broken,
        last_checked_broken: new Date().toISOString(),
      })
      .eq("id", link.id);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in /api/check-link:", err);
    return NextResponse.json({ error: "Unexpected error", details: err?.message || err.toString() }, { status: 500 });
  }
}