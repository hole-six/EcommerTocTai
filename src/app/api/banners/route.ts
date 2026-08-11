import { NextResponse } from "next/server";
import { Banner } from "@/models/Banner";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { bannerSchema } from "@/lib/server/banner-validator";

export async function GET(request: Request) { try { await connectDb(); const placement = new URL(request.url).searchParams.get("placement") ?? "home_hero"; return NextResponse.json({ data: await Banner.find({ placement, isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean() }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { await requireAdmin(); const data = bannerSchema.parse(await request.json()); await connectDb(); return NextResponse.json({ data: await Banner.create(data) }, { status: 201 }); } catch (error) { return apiError(error); } }
