import { NextResponse } from "next/server";
import { catalogRepository } from "@/lib/catalog/repository";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import type { CatalogProduct } from "@/lib/catalog/types";
export async function GET() { try { return NextResponse.json({ data: await catalogRepository.list() }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { await requireAdmin(); const product = await request.json() as CatalogProduct; if (!product.id || !product.slug || !product.name || !product.sku) return NextResponse.json({ error: "id, slug, sku and name are required" }, { status: 400 }); return NextResponse.json({ data: await catalogRepository.create(product) }, { status: 201 }); } catch (error) { return apiError(error); } }