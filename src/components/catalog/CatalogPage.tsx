"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ShoppingBag, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import styles from "./CatalogPage.module.css";

type Category = { id: string; name: string; slug: string; image: string; bannerImage?: string; children: Category[] };
type Product = { id: string; name: string; slug: string; category: string; price: number; salePrice?: number; image: string };

const asset = "/sites/manmatters-com-61d14dee/root-8a5edab2/";
const fallbackCategories: Category[] = [
  { id: "hair", name: "Tóc", slug: "toc", image: `${asset}concern-hair.png`, bannerImage: "/images/anhtoctai1.avif", children: [{ id: "hair-kits", name: "Bộ chăm sóc", slug: "bo-cham-soc", image: "", children: [] }, { id: "hair-thinning", name: "Tóc thưa mỏng", slug: "toc-thua-mong", image: "", children: [] }, { id: "hair-growth", name: "Hỗ trợ mọc tóc", slug: "ho-tro-moc-toc", image: "", children: [] }, { id: "hair-flakes", name: "Gàu và ngứa", slug: "gau-va-ngua", image: "", children: [] }] },
  { id: "scalp", name: "Da đầu", slug: "da-dau", image: `${asset}concern-skin.png`, bannerImage: "/images/anhtoctai2.avif", children: [{ id: "scalp-clean", name: "Làm sạch sâu", slug: "lam-sach-sau", image: "", children: [] }, { id: "scalp-sensitive", name: "Da đầu nhạy cảm", slug: "da-dau-nhay-cam", image: "", children: [] }] },
  { id: "repair", name: "Phục hồi", slug: "phuc-hoi", image: `${asset}concern-beard.png`, bannerImage: "/images/anhtoctai3.avif", children: [{ id: "repair-dyed", name: "Tóc nhuộm", slug: "toc-nhuom", image: "", children: [] }, { id: "repair-dry", name: "Tóc khô xơ", slug: "toc-kho-xo", image: "", children: [] }] },
  { id: "care", name: "Dưỡng tóc", slug: "duong-toc", image: `${asset}concern-nutrition.png`, bannerImage: "/images/anhtoctai4.avif", children: [{ id: "care-shampoo", name: "Dầu gội", slug: "dau-goi", image: "", children: [] }, { id: "care-serum", name: "Tinh chất", slug: "tinh-chat", image: "", children: [] }] },
];
const fallbackProducts: Product[] = [
  { id: "1", name: "Serum Mọc Tóc 5%", slug: "serum-moc-toc-5", category: "Hỗ trợ mọc tóc", price: 349000, salePrice: 420000, image: `${asset}product-lotion.png` },
  { id: "2", name: "Dầu Gội Sạch Da Đầu", slug: "dau-goi-sach-da-dau", category: "Làm sạch sâu", price: 239000, image: `${asset}product-electrolyte.jpg` },
  { id: "3", name: "Bộ Phục Hồi Tóc Hư Tổn", slug: "bo-phuc-hoi-toc-hu-ton", category: "Tóc khô xơ", price: 579000, salePrice: 690000, image: `${asset}product-magnesium.jpg` },
  { id: "4", name: "Tinh Chất Cân Bằng Da Đầu", slug: "tinh-chat-da-dau", category: "Da đầu nhạy cảm", price: 429000, image: `${asset}product-shilajit.png` },
];
const formatPrice = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export function CatalogPage({ initialCategory }: { initialCategory?: string }) {
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [selected, setSelected] = useState(initialCategory ?? "all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const current = categories.find((category) => category.slug === selected) ?? categories[0];
  const chooseCategory = (slug: string) => { setSelected(slug); setSelectedSubcategory(null); };

  useEffect(() => {
    fetch("/api/categories?tree=true").then((response) => response.ok ? response.json() : null).then((payload) => {
      if (payload?.data?.length) setCategories(payload.data.map((category: { _id: string; name: string; slug: string; image: string; bannerImage?: string; children: Array<{ _id: string; name: string; slug: string; image: string }> }) => ({ id: category._id, name: category.name, slug: category.slug, image: category.image, bannerImage: category.bannerImage, children: category.children.map((child) => ({ id: child._id, name: child.name, slug: child.slug, image: child.image, children: [] })) })));
    }).catch(() => undefined);
    fetch("/api/commerce/products").then((response) => response.ok ? response.json() : null).then((payload) => {
      if (payload?.data?.length) setProducts(payload.data.map((product: { _id: string; name: string; slug: string; price: number; salePrice?: number; images: string[]; category: { name: string } }) => ({ id: product._id, name: product.name, slug: product.slug, category: product.category.name, price: product.price, salePrice: product.salePrice, image: product.images[0] ?? "" })));
    }).catch(() => undefined);
  }, []);

  const shownProducts = useMemo(() => selected === "all" ? products : products.filter((product) => selectedSubcategory ? product.category === selectedSubcategory : current.children.some((child) => child.name === product.category)), [current, products, selected, selectedSubcategory]);
  return <main className={styles.page}><SiteHeader compact /><div className={styles.catalog}>
    <aside className={styles.sidebar}><button onClick={() => chooseCategory("all")} className={selected === "all" ? styles.activeSide : ""}><Image className={styles.allIcon} src="/images/categories/all-categories.png" alt="Tất cả danh mục" width={55} height={55} /><b>Tất cả<br />sản phẩm</b></button>{categories.map((category) => <button key={category.slug} onClick={() => chooseCategory(category.slug)} className={selected === category.slug ? styles.activeSide : ""}><Image src={category.image} alt="" width={62} height={62} /><span>{category.name}</span></button>)}</aside>
    <section className={styles.content}>{selected !== "all" && <div className={styles.subnav}>{current.children.map((child) => <button key={child.slug} onClick={() => setSelectedSubcategory(selectedSubcategory === child.name ? null : child.name)} className={selectedSubcategory === child.name ? styles.activeSubnav : ""}>{child.name}</button>)}</div>}
      <div className={`${styles.bannerRail} ${selected === "all" ? styles.allBanners : styles.categoryBanner}`}>{(selected === "all" ? categories : [current]).map((category) => <button className={styles.banner} key={category.slug} onClick={() => chooseCategory(category.slug)}><Image src={category.bannerImage || category.image} alt={category.name} width={720} height={300} priority /></button>)}</div>
      <div className={styles.products}>{shownProducts.map((product) => <article key={product.id} className={styles.product}><Link href={`/products/${product.slug}`} className={styles.productImage}><Image src={product.image} alt={product.name} width={480} height={480} /></Link><div className={styles.productInfo}><p>{product.category}</p><h2>{product.name}</h2><span className={styles.rating}><Star size={12} fill="currentColor" /> 4.8</span><div><strong>{formatPrice(product.price)}</strong>{product.salePrice && <del>{formatPrice(product.salePrice)}</del>}</div><button><Plus size={14} /> THÊM</button></div></article>)}</div>
    </section></div><div className={styles.cartDock}><ShoppingBag size={18} /><span>Giỏ hàng của bạn</span><b>0</b></div></main>;
}
