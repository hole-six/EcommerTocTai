import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { Media } from "@/models/Media";

export const runtime = "nodejs";
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg" };

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDb();
    const search = new URL(request.url).searchParams.get("search")?.trim();
    const filter = search ? { originalName: { $regex: search, $options: "i" } } : {};
    return NextResponse.json({ data: await Media.find(filter).sort({ createdAt: -1 }).limit(300).lean() });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || !allowed.has(file.type)) return NextResponse.json({ error: "Vui lòng chọn file ảnh hợp lệ" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Ảnh không được vượt quá 8MB" }, { status: 400 });
    const folder = path.join(process.cwd(), "public", "uploads", "products"); await mkdir(folder, { recursive: true });
    const filename = `${randomUUID()}.${extensions[file.type]}`; await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/products/${filename}`;
    await connectDb();
    const record = await Media.create({ url, originalName: file.name, size: file.size, mimeType: file.type });
    return NextResponse.json({ data: { _id: record._id, url, name: file.name, size: file.size } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload ảnh thất bại" }, { status: 500 }); }
}
