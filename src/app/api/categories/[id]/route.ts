import { NextResponse } from "next/server";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { categorySchema } from "@/lib/server/validators";

export async function PATCH(request: Request, context: RouteContext<"/api/categories/[id]">) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const data = categorySchema.partial().parse(await request.json());
    await connectDb();
    if (data.parent !== undefined && data.parent !== null) {
      if (data.parent === id) return NextResponse.json({ error: "Danh mục không thể là danh mục cha của chính nó." }, { status: 422 });
      const parent = await Category.findById(data.parent).select("parent isActive").lean();
      if (!parent || !parent.isActive) return NextResponse.json({ error: "Danh mục cha không tồn tại hoặc đang ẩn." }, { status: 422 });
      if (parent.parent) return NextResponse.json({ error: "Chỉ hỗ trợ cấu trúc danh mục cha và một cấp danh mục con." }, { status: 422 });
    }
    const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return category ? NextResponse.json({ data: category }) : NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_request: Request, context: RouteContext<"/api/categories/[id]">) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await connectDb();
    const [category, childCount, productCount] = await Promise.all([
      Category.findById(id).lean(),
      Category.countDocuments({ parent: id }),
      Product.countDocuments({ category: id }),
    ]);
    if (!category) return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });
    if (childCount > 0 || productCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa “${category.name}” vì còn ${childCount} danh mục con và ${productCount} sản phẩm liên quan. Hãy chuyển dữ liệu hoặc ẩn danh mục trước.` },
        { status: 409 },
      );
    }
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) { return apiError(error); }
}
