import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    await supabase.auth.signOut();

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear auth cookies
    response.cookies.set("sb-auth-token", "", { maxAge: 0 });
    response.cookies.set("sb-session", "", { maxAge: 0 });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
