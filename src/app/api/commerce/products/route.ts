import { NextResponse } from "next/server";
import { Product } from "@/models/Product";
import { CatalogProduct } from "@/models/CatalogProduct";
import { Category } from "@/models/Category";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { escapeRegex, paginationMeta, parsePagination } from "@/lib/server/pagination";
import { productSchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await connectDb();
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const categorySlug = url.searchParams.get("categorySlug");
    const variantGroup = url.searchParams.get("variantGroup");
    const includeAll = url.searchParams.get("status") === "all";
    if (includeAll) await requireAdmin();
    let categoryIds: string[] | undefined = category ? [category] : undefined;
    if (categorySlug) {
      const root = await Category.findOne({ slug: categorySlug }).lean();
      if (!root) return NextResponse.json({ data: [] });
      const children = await Category.find({ parent: root._id })
        .select("_id")
        .lean();
      categoryIds = [
        root._id.toString(),
        ...children.map((child) => child._id.toString()),
      ];
    }

    // Admin table listings (products/inventory pages) opt in with `page` — server-side
    // search + filter + pagination over Product only. CatalogProduct is a legacy,
    // admin-unmanaged import source (currently empty) so it's intentionally excluded
    // here; every other caller omits `page` and keeps the original full-list behavior
    // below for backward compatibility (dashboards, dropdown pickers, storefront).
    if (url.searchParams.get("page")) {
      const { page, limit, skip } = parsePagination(url);
      const q = url.searchParams.get("q")?.trim();
      const productStatus = url.searchParams.get("productStatus");
      const stock = url.searchParams.get("stock");
      const filter: Record<string, unknown> = {};
      if (!includeAll) filter.status = "active";
      else if (productStatus && productStatus !== "all") filter.status = productStatus;
      if (categoryIds) filter.category = { $in: categoryIds };
      if (variantGroup) filter.variantGroup = variantGroup;
      if (q) {
        const regex = new RegExp(escapeRegex(q), "i");
        filter.$or = [{ name: regex }, { sku: regex }, { slug: regex }, { shortDescription: regex }];
      }
      if (stock === "low") {
        filter.status = "active";
        filter.inventory = { $lt: 10 };
      } else if (stock === "reserved") {
        filter.reservedInventory = { $gt: 0 };
      } else if (stock === "available") {
        filter.$expr = { $gt: ["$inventory", "$reservedInventory"] };
      }
      const sort: Record<string, 1 | -1> = variantGroup ? { variantOrder: 1 } : { createdAt: -1 };
      const [data, total] = await Promise.all([
        Product.find(filter).populate("category", "name slug parent").sort(sort).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);
      return NextResponse.json({ data, pagination: paginationMeta(page, limit, total) });
    }

    const filter = {
      ...(includeAll ? {} : { status: "active" }),
      ...(categoryIds ? { category: { $in: categoryIds } } : {}),
      ...(variantGroup ? { variantGroup } : {}),
    };
    const sort: Record<string, 1 | -1> = variantGroup
      ? { variantOrder: 1 }
      : { createdAt: -1 };
    const products = await Product.find(filter)
      .populate("category", "name slug parent")
      .sort(sort)
      .lean();
    if (categoryIds || variantGroup)
      return NextResponse.json({ data: products });
    const catalogFilter = includeAll ? {} : { status: "active" };
    const catalogProducts = await CatalogProduct.find(catalogFilter)
      .sort({ createdAt: -1 })
      .lean();
    const imported = catalogProducts.map((product) => ({
      _id: product.id,
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      category: { name: product.category, slug: product.category },
      price: product.compareAtPrice ?? product.price,
      salePrice: product.compareAtPrice ? product.price : undefined,
      inventory: product.inventory,
      status: product.status,
      images: product.images,
      shortDescription: product.shortDescription,
      source: "catalog",
    }));
    return NextResponse.json({ data: [...products, ...imported] });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = productSchema.parse(await request.json());
    await connectDb();
    const category = await Category.findOne({ _id: data.category, isActive: true }).select("_id").lean();
    if (!category) return NextResponse.json({ error: "Danh mục sản phẩm không tồn tại hoặc đang ẩn." }, { status: 422 });
    return NextResponse.json(
      { data: await Product.create(data) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
