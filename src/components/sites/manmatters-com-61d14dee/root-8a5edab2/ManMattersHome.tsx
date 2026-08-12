"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  ClipboardList,
  Package,
  Stethoscope,
  CalendarCheck,
} from "lucide-react";
import { SiteHeader } from "../shared/SiteHeader";
import { SiteFooter } from "../shared/SiteFooter";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import styles from "./ManMattersHome.module.css";

const asset = "/sites/manmatters-com-61d14dee/root-8a5edab2/";
const concerns = [
  {
    name: "Hair",
    alt: "Men's hair care and regrowth solutions",
    image: "concern-hair.png",
    href: "/hair-matters",
  },
  {
    name: "Beard",
    alt: "Men's beard growth and grooming solutions",
    image: "concern-beard.png",
    href: "/beard-matters",
  },
  {
    name: "Skin",
    alt: "Men's skin care solutions",
    image: "concern-skin.png",
    href: "/skin-matters",
  },
  {
    name: "Nutrition",
    alt: "Men's nutrition and wellness supplements",
    image: "concern-nutrition.png",
    href: "/nutrition-matters",
  },
];

const trustBadges = [
  "Third Party Lab Tested",
  "Clinically Tested",
  "Scientifically Backed",
  "Clean Ingredients",
  "Expert Formulated",
  "NABL Lab Tested",
];

const steps = [
  { icon: ClipboardList, label: "Take the Hair Test", n: "01" },
  { icon: Package, label: "Get a stage-matched kit", n: "02" },
  { icon: Stethoscope, label: "Consult an expert", n: "03" },
  { icon: CalendarCheck, label: "See results in 5-6 months", n: "04" },
];

const reviews = [
  "review-1.png",
  "review-2.png",
  "review-3.png",
  "review-4.png",
  "review-5.png",
];

type ParentCategory = {
  _id: string;
  name: string;
  slug: string;
};

type HomeProduct = {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  rating?: number;
  images: string[];
};

const faqs = [
  {
    q: "What is Man Matters?",
    a: "Man Matters is India's leading science-backed men's health platform focused on providing clinically credible solutions across hair care, beard growth, nutrition, sleep, and wellness. Built around doctor consultations and evidence-led formulations, the platform has helped over 10 lakh Indian men address hair loss and other health concerns over the past six years.",
  },
  {
    q: "Are Man Matters products safe to use?",
    a: "Yes. Every formulation goes through ingredient-level clinical review before it's added to a product, and active ingredient levels are tested for consistency and purity. Prescription-only treatments require a valid prescription and doctor consultation. Always check the product label, and consult a doctor if you have an existing health condition.",
  },
  {
    q: "Does Man Matters actually work?",
    a: "Results depend on the concern, the product, and consistency of use — outcomes vary by individual. Every formulation is backed by clinical evidence and developed with category experts, and each concern comes with a realistic timeline rather than a blanket promise.",
  },
  {
    q: "Are Man Matters products doctor-recommended?",
    a: "Every formulation is developed with domain experts and research scientists — involved from the start. Prescription treatments are additionally reviewed by a registered medical practitioner before they're recommended to you.",
  },
  {
    q: "What concerns can I use Man Matters for?",
    a: "Man Matters covers concerns such as: hair (loss, thinning, dandruff), skin, beard growth and grooming, and nutrition and supplements. Pick your concern on the homepage, and the platform recommends products built for it — no browsing a generic catalogue, no guessing what's relevant to you.",
  },
];

export function ManMattersHome() {
  const [slide, setSlide] = useState(0);
  const [banners, setBanners] = useState<
    Array<{ image: string; alt: string; cta: string; href: string }>
  >([]);
  const [promoBanners, setPromoBanners] = useState<
    Array<{ image: string; alt: string; cta: string; href: string }>
  >([]);
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>(
    [],
  );
  const [activeCategory, setActiveCategory] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { addItem } = useCart();
  useEffect(() => {
    Promise.all([
      fetch("/api/banners?placement=home_hero").then((response) =>
        response.ok ? response.json() : { data: [] },
      ),
      fetch("/api/banners?placement=home_promo").then((response) =>
        response.ok ? response.json() : { data: [] },
      ),
      fetch("/api/categories?tree=true").then((response) =>
        response.ok ? response.json() : { data: [] },
      ),
    ])
      .then(([bannerPayload, promoPayload, categoryPayload]) => {
        setBanners(
          (bannerPayload.data ?? []).map(
            (banner: {
              image: string;
              alt: string;
              ctaLabel: string;
              ctaHref: string;
            }) => ({
              image: banner.image,
              alt: banner.alt,
              cta: banner.ctaLabel,
              href: banner.ctaHref,
            }),
          ),
        );
        setPromoBanners(
          (promoPayload.data ?? []).map(
            (banner: {
              image: string;
              alt: string;
              ctaLabel: string;
              ctaHref: string;
            }) => ({
              image: banner.image,
              alt: banner.alt,
              cta: banner.ctaLabel,
              href: banner.ctaHref,
            }),
          ),
        );
        const nextCategories = (categoryPayload.data ?? []) as ParentCategory[];
        setParentCategories(nextCategories);
        if (nextCategories.length) setActiveCategory(nextCategories[0].slug);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    const controller = new AbortController();

    fetch(
      `/api/commerce/products?categorySlug=${encodeURIComponent(activeCategory)}`,
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload) => setProducts(payload.data ?? []))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setProducts([]);
      });

    return () => controller.abort();
  }, [activeCategory]);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = window.setInterval(
      () => setSlide((value) => (value + 1) % banners.length),
      4800,
    );
    return () => window.clearInterval(timer);
  }, [banners.length]);

  return (
    <main className={styles.page}>
      <SiteHeader />

      {banners.length > 0 && (
        <section className={styles.hero}>
          {banners.map((s, index) => (
            <Image
              key={s.image}
              className={`${styles.heroImage} ${index === slide ? styles.activeSlide : ""}`}
              src={s.image}
              alt={s.alt}
              width={1440}
              height={692}
              priority={index === 0}
            />
          ))}
          <a className={styles.heroCta} href={banners[slide].href}>
            {banners[slide].cta}
          </a>
          <div className={styles.dots}>
            {banners.map((s, index) => (
              <button
                key={s.image}
                onClick={() => setSlide(index)}
                className={index === slide ? styles.activeDot : ""}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {promoBanners.length > 0 && (
        <section className={styles.promoBanners}>
          {promoBanners.map((banner) => (
            <a href={banner.href} key={banner.image}>
              <Image
                src={banner.image}
                alt={banner.alt}
                width={1440}
                height={360}
              />
            </a>
          ))}
        </section>
      )}

      <section className={styles.statBar}>
        <div className={styles.statBarInner}>
          <div>
            <b>10.000+</b>
            <span>Khách hàng đã tin chọn</span>
          </div>
          <div className={styles.statDivider} />
          <div>
            <b>4.9/5</b>
            <span>Đánh giá trung bình</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h1 className={styles.sectionHeading}>Chọn theo điều tóc cần</h1>
        <div className={styles.concernGrid}>
          {concerns.map((c) => (
            <Link href="/shop/all" className={styles.concern} key={c.name}>
              <Image
                src={`${asset}${c.image}`}
                alt={c.alt}
                width={640}
                height={800}
              />
              <span className={styles.concernLabel}>
                <ChevronRight size={20} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.marqueeWrap}>
        <div className={styles.marquee}>
          {[...trustBadges, ...trustBadges].map((label, i) => (
            <span key={i}>✦ {label}</span>
          ))}
        </div>
      </div>

      <section id="shop" className={`${styles.section} ${styles.shop}`}>
        <h2>Sản phẩm được yêu thích</h2>
        <div className={styles.categoryRow}>
          {parentCategories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => setActiveCategory(category.slug)}
              className={`${styles.categoryButton} ${activeCategory === category.slug ? styles.selectedCategory : ""}`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className={styles.productGrid}>
          {products.map((p) => (
            <article className={styles.product} key={p._id}>
              <Link
                href={`/san-pham/${p.slug}`}
                className={styles.productImage}
              >
                {p.images[0] && (
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    width={800}
                    height={800}
                  />
                )}
              </Link>
              <div className={styles.productBody}>
                <p>{p.shortDescription}</p>
                <Link
                  href={`/san-pham/${p.slug}`}
                  className={styles.productTitleLink}
                >
                  <h3>{p.name}</h3>
                </Link>
                <div className={styles.priceRow}>
                  <strong>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(p.price)}
                  </strong>
                  {p.compareAtPrice && (
                    <del>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(p.compareAtPrice)}
                    </del>
                  )}
                  <em>★ {p.rating ?? "-"}</em>
                </div>
                <button
                  onClick={() =>
                    addItem({
                      productId: p._id,
                      name: p.name,
                      price: p.price,
                      image: p.images[0] ?? "",
                    })
                  }
                >
                  <Plus size={16} /> ADD
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.guessworkCard}>
          <h2>Đừng để mái tóc chỉ là một phỏng đoán</h2>
          <div className={styles.stepsGrid}>
            {steps.map((s) => (
              <div className={styles.step} key={s.label}>
                <s.icon size={28} />
                <span>{s.label}</span>
                <em>{s.n}</em>
              </div>
            ))}
          </div>
          <a className={styles.guessworkCta} href="/pages/hair-form-assessment">
            Bắt đầu kiểm tra tóc <ChevronRight size={16} />
          </a>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Chia sẻ từ khách hàng</h2>
        <div className={styles.reviews}>
          {reviews.map((r) => (
            <Image
              key={r}
              src={`${asset}${r}`}
              alt="Review from a Man Matters customer"
              width={500}
              height={735}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.experts}>
          <h2>Xây routine bằng sự thấu hiểu.</h2>
          <p>
            Chăm sóc tóc là hành trình dài. Tóc Tai giúp bạn bắt đầu đơn giản và
            duy trì thật đều đặn.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Câu hỏi thường gặp</h2>
        <div className={styles.faq}>
          {faqs.map((f, i) => (
            <div
              className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ""}`}
              key={f.q}
            >
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <ChevronDown size={18} />
              </button>
              <div className={styles.faqAnswer}>
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
