import { NextResponse } from "next/server";
import { Consultation } from "@/models/Consultation";
import { currentUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { paginationMeta, parsePagination } from "@/lib/server/pagination";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.customer?.fullName || !body?.customer?.phone) return NextResponse.json({ error: "Vui lòng nhập họ tên và số điện thoại." }, { status: 400 });
    await connectDb();
    const user = await currentUser();
    const answers = body.answers ?? {};
    const focus = answers.concern ?? answers.hairLoss ?? "Hair health";
    const result = { focus, recommendation: focus === "Dandruff & flaking" ? "Scalp-first cleansing routine" : "Strengthening and scalp-care routine", message: "A Man Matters expert will call you within 3–5 minutes." };
    const consultation = await Consultation.create({ ...body, user: user?.id ?? null, result, status: "submitted" });
    return NextResponse.json({ data: { id: consultation._id.toString(), result } }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    await connectDb();
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const [data, total] = await Promise.all([
      Consultation.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Consultation.countDocuments(),
    ]);
    return NextResponse.json({ data, pagination: paginationMeta(page, limit, total) });
  } catch (error) { return apiError(error); }
}
