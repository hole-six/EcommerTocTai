import { NextResponse } from "next/server";

export function GET() { return NextResponse.json({ status: "ok", service: "toc-tai-commerce", timestamp: new Date().toISOString() }); }
