import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.flatten() }, { status: 422 });
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
  if (error instanceof Error && error.message.includes("MONGODB_URI")) return NextResponse.json({ error: "Database chưa được cấu hình" }, { status: 503 });
  return NextResponse.json({ error: "Có lỗi xảy ra. Vui lòng thử lại." }, { status: 500 });
}
