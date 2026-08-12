import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowed.has(file.type)) return NextResponse.json({ error: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Ảnh không được vượt quá 10MB." }, { status: 400 });
  const folder = path.join(process.cwd(), "public", "uploads", "consultations");
  await mkdir(folder, { recursive: true });
  const url = `/uploads/consultations/${randomUUID()}.${allowed.get(file.type)}`;
  await writeFile(path.join(process.cwd(), "public", url.slice(1)), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ data: { url } }, { status: 201 });
}
