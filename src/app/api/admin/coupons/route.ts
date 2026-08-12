import { NextResponse } from "next/server";
import { Coupon } from "@/models/Coupon";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { couponSchema } from "@/lib/server/validators";

export async function GET() { try { await requireAdmin(); await connectDb(); return NextResponse.json({ data: await Coupon.find().sort({ createdAt: -1 }).lean() }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { await requireAdmin(); const data = couponSchema.parse(await request.json()); await connectDb(); return NextResponse.json({ data: await Coupon.create(data) }, { status: 201 }); } catch (error) { return apiError(error); } }
