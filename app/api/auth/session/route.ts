import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE = "__session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: "Server auth not configured" },
        { status: 500 }
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
