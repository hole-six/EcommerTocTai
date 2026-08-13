import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { Product } from "@/models/Product";
import { CatalogProduct } from "@/models/CatalogProduct";
import { Category } from "@/models/Category";
import { currentUser, requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { onlyProvidedFields, productPatchSchema } from "@/lib/server/validators";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/commerce/products/[id]">,
) {
  try {
    const { id } = await context.params;
    await connectDb();
    const session = await currentUser();
    const filter: Record<string, unknown> = {
      $or: isValidObjectId(id) ? [{ _id: id }, { slug: id }] : [{ slug: id }],
    };
    if (session?.role !== "admin") filter.status = "active";
    const product = await Product.findOne(filter)
      .populate("category", "name slug detailFields")
      .lean();
    if (product) return NextResponse.json({ data: product });
    const catalogProduct = await CatalogProduct.findOne({
      $or: [{ id }, { slug: id }],
    }).lean();
    if (
      !catalogProduct ||
      (session?.role !== "admin" && catalogProduct.status !== "active")
    )
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm" },
        { status: 404 },
      );
    const description =
      catalogProduct.blocks
        ?.find((block: { type?: string }) => block.type === "richText")
        ?.data?.paragraphs?.join("\n") ?? "";
    return NextResponse.json({
      data: {
        ...catalogProduct,
        _id: catalogProduct.id,
        category: catalogProduct.category,
        price: catalogProduct.compareAtPrice ?? catalogProduct.price,
        salePrice: catalogProduct.compareAtPrice
          ? catalogProduct.price
          : undefined,
        description,
        source: "catalog",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/commerce/products/[id]">,
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const raw = await request.json();
    const data = onlyProvidedFields(productPatchSchema.parse(raw), raw);
    await connectDb();
    if (data.category) {
      const category = await Category.findOne({ _id: data.category, isActive: true }).select("_id").lean();
      if (!category) return NextResponse.json({ error: "Danh mục sản phẩm không tồn tại hoặc đang ẩn." }, { status: 422 });
    }
    if (data.inventory !== undefined) {
      const current = await Product.findById(id).select("reservedInventory").lean();
      if (current && data.inventory < current.reservedInventory) {
        return NextResponse.json(
          { error: `Tồn kho không thể thấp hơn ${current.reservedInventory} sản phẩm đang được giữ cho đơn hàng.` },
          { status: 422 },
        );
      }
    }
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (product) return NextResponse.json({ data: product });
    const catalogProduct = await CatalogProduct.findOneAndUpdate(
      { id },
      {
        $set: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          shortDescription: data.shortDescription,
          price: data.salePrice ?? data.price,
          compareAtPrice: data.salePrice !== undefined ? data.price : undefined,
          inventory: data.inventory,
          images: data.images,
          status: data.status,
        },
      },
      { new: true, runValidators: true },
    ).lean();
    return catalogProduct
      ? NextResponse.json({
          data: { ...catalogProduct, _id: catalogProduct.id },
        })
      : NextResponse.json(
          { error: "Không tìm thấy sản phẩm" },
          { status: 404 },
        );
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/commerce/products/[id]">,
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await connectDb();
    const product = await Product.findByIdAndUpdate(
      id,
      { status: "archived" },
      { new: true },
    );
    if (product) return NextResponse.json({ data: { success: true } });
    const catalogProduct = await CatalogProduct.findOneAndUpdate(
      { id },
      { status: "archived" },
      { new: true },
    );
    return catalogProduct
      ? NextResponse.json({ data: { success: true } })
      : NextResponse.json(
          { error: "Không tìm thấy sản phẩm" },
          { status: 404 },
        );
  } catch (error) {
    return apiError(error);
  }
}
