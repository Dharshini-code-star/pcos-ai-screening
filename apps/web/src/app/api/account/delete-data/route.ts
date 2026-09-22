import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { error } = await supabase.rpc("delete_my_data");
  if (error) {
    console.error("delete_my_data failed", error);
    return NextResponse.json({ error: "Could not delete your data." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
