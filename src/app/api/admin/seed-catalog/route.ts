import { NextResponse } from "next/server";
import { seedCatalog } from "@/lib/commerce/catalog-seed";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST() { try { await requireAdmin(); await connectDb(); return NextResponse.json({ data: await seedCatalog() }); } catch (error) { return apiError(error); } }
