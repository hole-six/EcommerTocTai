import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
const allowed = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
const extensions: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/ogg": "ogv", "video/quicktime": "mov" };

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !allowed.has(file.type)) {
      return NextResponse.json({ error: "Vui lòng chọn file video hợp lệ (mp4, webm, mov)" }, { status: 400 });
    }
    if (file.size > 60 * 1024 * 1024) {
      return NextResponse.json({ error: "Video không được vượt quá 60MB" }, { status: 400 });
    }
    const folder = path.join(process.cwd(), "public", "uploads", "videos");
    await mkdir(folder, { recursive: true });
    const filename = `${randomUUID()}.${extensions[file.type]}`;
    await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/videos/${filename}`;
    return NextResponse.json({ data: { url } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload video thất bại" }, { status: 500 });
  }
}
