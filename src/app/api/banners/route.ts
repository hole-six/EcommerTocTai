import { NextResponse } from "next/server";
import { Banner } from "@/models/Banner";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { bannerSchema } from "@/lib/server/banner-validator";

export async function GET(request: Request) { try { const url = new URL(request.url); const placement = url.searchParams.get("placement") ?? "home_hero"; const slotKey = url.searchParams.get("slotKey"); const categorySlug = url.searchParams.get("categorySlug"); const all = url.searchParams.get("all") === "true"; if (all) await requireAdmin(); await connectDb(); const filter = all ? (placement === "all" ? {} : { placement }) : { placement, isActive: true, ...(slotKey ? { slotKey } : {}), ...(categorySlug ? { categorySlug } : {}) }; return NextResponse.json({ data: await Banner.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean() }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { await requireAdmin(); const data = bannerSchema.parse(await request.json()); await connectDb(); const record = data.slotKey ? await Banner.findOneAndUpdate({ slotKey: data.slotKey }, data, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }) : await Banner.create(data); return NextResponse.json({ data: record }, { status: 201 }); } catch (error) { return apiError(error); } }
