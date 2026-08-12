import { CatalogProduct } from "@/models/CatalogProduct";
import { connectDb } from "@/lib/server/db";
import type { CatalogProduct as CatalogProductData } from "./types";
const plain = (value: Record<string, unknown>) => { const { _id, __v, createdAt, updatedAt, ...rest } = value; return rest as CatalogProductData; };
export const catalogRepository = {
  async list(): Promise<CatalogProductData[]> { await connectDb(); return (await CatalogProduct.find({ status: "active" }).sort({ createdAt: -1 }).lean()).map((item) => plain(item as Record<string, unknown>)); },
  async find(slugOrId: string): Promise<CatalogProductData | undefined> { await connectDb(); const item = await CatalogProduct.findOne({ $or: [{ slug: slugOrId }, { id: slugOrId }], status: { $ne: "archived" } }).lean(); return item ? plain(item as Record<string, unknown>) : undefined; },
  async create(product: CatalogProductData): Promise<CatalogProductData> { await connectDb(); const created = await CatalogProduct.create(product); return plain(created.toObject() as Record<string, unknown>); },
  async update(slugOrId: string, patch: Partial<CatalogProductData>): Promise<CatalogProductData | undefined> { await connectDb(); const item = await CatalogProduct.findOneAndUpdate({ $or: [{ slug: slugOrId }, { id: slugOrId }] }, patch, { new: true, runValidators: true }).lean(); return item ? plain(item as Record<string, unknown>) : undefined; },
};