"use client";
import Image from "next/image";
import Link from "next/link";
import { Plus, ShoppingBag, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import { SiteFooter } from "@/components/sites/manmatters-com-61d14dee/shared/SiteFooter";
import { useCart } from "@/contexts/CartContext";
import styles from "./CatalogPage.module.css";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  bannerImage?: string;
  children: Category[];
};
type Product = {
  id: string;
  name: string;
  slug: string;
  category: { name: string; slug: string } | string;
  price: number;
  salePrice?: number;
  compareAtPrice?: number;
  images: string[];
  rating?: number;
  source?: "catalog";
};
type CategoryBanner = {
  image: string;
  mobileImage?: string;
  alt: string;
  ctaHref?: string;
};
const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
const categoryLabel = (category: Product["category"]) =>
  typeof category === "string" ? category : (category?.name ?? "");
const productHref = (product: Product) =>
  product.source === "catalog"
    ? `/dp/${product.slug}/${product.id}`
    : `/san-pham/${product.slug}`;

export function CatalogPage({
  initialCategory = "all",
}: {
  initialCategory?: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );
  const [categoryBanner, setCategoryBanner] = useState<CategoryBanner | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  useEffect(() => {
    Promise.all([
      fetch("/api/categories?tree=true").then((response) => response.json()),
      fetch("/api/commerce/products").then((response) => response.json()),
    ])
      .then(([categoryBody, productBody]) => {
        setCategories(
          (categoryBody.data ?? []).map(
            (category: Category & { _id: string }) => ({
              id: category._id,
              name: category.name,
              slug: category.slug,
              image: category.image,
              bannerImage: category.bannerImage,
              children: category.children ?? [],
            }),
          ),
        );
        setProducts(productBody.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const query =
      selected === "all"
        ? "placement=all_products&slotKey=all-products-top"
        : `placement=category&categorySlug=${encodeURIComponent(selected)}`;
    fetch(`/api/banners?${query}`)
      .then((response) => response.json())
      .then((body) => setCategoryBanner(body.data?.[0] ?? null))
      .catch(() => setCategoryBanner(null));
  }, [selected]);
  const current = categories.find((category) => category.slug === selected);
  const chooseCategory = (slug: string) => {
    setSelected(slug);
    setSelectedSubcategory(null);
  };
  const shownProducts = useMemo(() => {
    if (selected === "all") return products;
    const child = current?.children.find(
      (item) => item.slug === selectedSubcategory,
    );
    const matchSlugs = new Set(
      (child
        ? [child.slug]
        : [selected, ...(current?.children.map((item) => item.slug) ?? [])]
      ).map((value) => value.toLowerCase()),
    );
    const matchNames = new Set(
      (child
        ? [child.name]
        : [current?.name, ...(current?.children.map((item) => item.name) ?? [])]
      )
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase()),
    );
    return products.filter((product) => {
      const label = categoryLabel(product.category).toLowerCase();
      const slug =
        typeof product.category === "string"
          ? ""
          : product.category?.slug?.toLowerCase();
      return (slug && matchSlugs.has(slug)) || matchNames.has(label);
    });
  }, [current, products, selected, selectedSubcategory]);
  const bannerImage =
    categoryBanner?.image ||
    (selected === "all" ? undefined : current?.bannerImage);
  return (
    <main className={styles.page}>
      <SiteHeader compact />
      <div className={styles.catalog}>
        <aside className={styles.sidebar}>
          <button
            onClick={() => chooseCategory("all")}
            className={selected === "all" ? styles.activeSide : ""}
          >
            <Image
              className={styles.allIcon}
              src="/images/all-categories.png"
              alt="Tất cả danh mục"
              width={62}
              height={62}
            />
            <b>
              TẤT CẢ
              <br />
              SẢN PHẨM
            </b>
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => chooseCategory(category.slug)}
              className={selected === category.slug ? styles.activeSide : ""}
            >
              {category.image && (
                <Image src={category.image} alt="" width={62} height={62} />
              )}
              <span>{category.name}</span>
            </button>
          ))}
        </aside>
        <section className={styles.content}>
          {current?.children.length ? (
            <div className={styles.subnav}>
              {current.children.map((child) => (
                <button
                  key={child.slug}
                  onClick={() =>
                    setSelectedSubcategory(
                      selectedSubcategory === child.slug ? null : child.slug,
                    )
                  }
                  className={
                    selectedSubcategory === child.slug
                      ? styles.activeSubnav
                      : ""
                  }
                >
                  {child.image && (
                    <Image src={child.image} alt="" width={30} height={30} />
                  )}
                  <span>{child.name}</span>
                </button>
              ))}
            </div>
          ) : null}
          {bannerImage && (
            <div className={`${styles.bannerRail} ${styles.categoryBanner}`}>
              <a
                className={styles.banner}
                href={categoryBanner?.ctaHref || `/shop/${selected}`}
              >
                <Image
                  src={bannerImage}
                  alt={
                    categoryBanner?.alt || current?.name || "Banner danh mục"
                  }
                  width={900}
                  height={360}
                  priority
                />
              </a>
            </div>
          )}
          <div className={styles.products}>
            {loading && <p>Đang tải sản phẩm...</p>}
            {!loading && shownProducts.length === 0 && (
              <p>Chưa có sản phẩm trong danh mục này.</p>
            )}
            {shownProducts.map((product) => (
              <article key={product.id} className={styles.product}>
                <Link
                  href={productHref(product)}
                  className={styles.productImage}
                >
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={480}
                      height={480}
                    />
                  )}
                </Link>
                <div className={styles.productInfo}>
                  <p>{categoryLabel(product.category)}</p>
                  <h2>{product.name}</h2>
                  <span className={styles.rating}>
                    <Star size={12} fill="currentColor" />{" "}
                    {product.rating ?? "-"}
                  </span>
                  <div>
                    <strong>
                      {formatPrice(product.salePrice ?? product.price)}
                    </strong>
                    {(product.compareAtPrice || product.salePrice) && (
                      <del>
                        {formatPrice(product.compareAtPrice ?? product.price)}
                      </del>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      addItem({
                        productId: product.id,
                        name: product.name,
                        price: product.salePrice ?? product.price,
                        image: product.images[0] ?? "",
                      })
                    }
                  >
                    <Plus size={14} /> THÊM
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <div className={styles.cartDock}>
        <ShoppingBag size={18} />
        <span>Giỏ hàng của bạn</span>
      </div>
      <SiteFooter />
    </main>
  );
}
