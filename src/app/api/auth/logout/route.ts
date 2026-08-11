import { NextResponse } from "next/server";

export async function POST() { const response = NextResponse.json({ data: { success: true } }); response.cookies.set({ name: "toc_tai_session", value: "", path: "/", maxAge: 0 }); return response; }
