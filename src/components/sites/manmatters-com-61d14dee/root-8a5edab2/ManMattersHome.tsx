"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  ClipboardList,
  Package,
  Stethoscope,
  CalendarCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../shared/SiteHeader";
import { SiteFooter } from "../shared/SiteFooter";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { showCartToast } from "@/components/cart/CartToast";
import styles from "./ManMattersHome.module.css";

const asset = "/sites/manmatters-com-61d14dee/root-8a5edab2/";
const isRuntimeUpload = (src: string) => src.startsWith("/uploads/");
const preloadImages = (sources: string[]) =>
  Promise.all(
    sources.filter(Boolean).map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new window.Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = src;
        }),
    ),
  );

const defaultMenVideos = [
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8e4e7b5ab468e85ba/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8a151fd521855d7fa/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8a151fd521855d7f5/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8eda64ba028b64bc9/main.mp4",
];
const concerns = [
  {
    name: "Tóc",
    alt: "Giải pháp chăm sóc tóc và hỗ trợ mọc tóc cho nam giới",
    image: "concern-hair.png",
    href: "/hair-matters",
  },
  {
    name: "Râu",
    alt: "Giải pháp chăm sóc và hỗ trợ mọc râu cho nam giới",
    image: "concern-beard.png",
    href: "/beard-matters",
  },
  {
    name: "Da",
    alt: "Giải pháp chăm sóc da cho nam giới",
    image: "concern-skin.png",
    href: "/skin-matters",
  },
  {
    name: "Dinh dưỡng",
    alt: "Thực phẩm bổ sung và giải pháp sức khỏe cho nam giới",
    image: "concern-nutrition.png",
    href: "/nutrition-matters",
  },
];

const trustBadges = [
  "Kiểm nghiệm bởi phòng lab độc lập",
  "Được kiểm chứng lâm sàng",
  "Dựa trên cơ sở khoa học",
  "Thành phần lành tính",
  "Công thức từ chuyên gia",
  "Kiểm nghiệm theo tiêu chuẩn lab",
];

const steps = [
  { icon: ClipboardList, label: "Làm bài kiểm tra tóc", n: "01" },
  { icon: Package, label: "Nhận bộ chăm sóc phù hợp giai đoạn", n: "02" },
  { icon: Stethoscope, label: "Tư vấn cùng chuyên gia", n: "03" },
  { icon: CalendarCheck, label: "Theo dõi kết quả sau 5-6 tháng", n: "04" },
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
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  compareAtPrice?: number;
  rating?: number;
  images: string[];
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const faqs = [
  {
    q: "Tóc Tai là gì?",
    a: "Tóc Tai là nền tảng chăm sóc tóc và sức khỏe nam giới, tập trung vào các giải pháp có cơ sở khoa học cho tóc, da đầu, râu, dinh dưỡng và thói quen sống. Chúng tôi kết hợp tư vấn chuyên gia với công thức được chọn lọc để giúp nam giới chăm sóc bản thân đơn giản và đều đặn hơn.",
  },
  {
    q: "Sản phẩm Tóc Tai có an toàn không?",
    a: "Mỗi công thức đều được rà soát theo thành phần trước khi đưa vào sản phẩm. Với các hoạt chất đặc trị, bạn nên đọc kỹ hướng dẫn trên nhãn và hỏi ý kiến bác sĩ nếu đang có bệnh nền, kích ứng da đầu hoặc đang dùng thuốc điều trị.",
  },
  {
    q: "Dùng sản phẩm có thật sự hiệu quả không?",
    a: "Kết quả phụ thuộc vào tình trạng tóc, sản phẩm được chọn và mức độ duy trì. Tóc Tai ưu tiên lộ trình thực tế theo từng nhu cầu thay vì hứa hẹn chung chung cho mọi người.",
  },
  {
    q: "Sản phẩm có được chuyên gia khuyên dùng không?",
    a: "Các công thức được xây dựng dựa trên kiến thức chuyên môn và dữ liệu thành phần. Với những liệu trình cần tư vấn y khoa, khách hàng nên trao đổi trực tiếp với bác sĩ hoặc chuyên gia phù hợp trước khi sử dụng.",
  },
  {
    q: "Tóc Tai hỗ trợ những nhu cầu nào?",
    a: "Bạn có thể tìm giải pháp cho rụng tóc, tóc thưa, gàu, chăm sóc da đầu, chăm sóc râu và dinh dưỡng. Hãy chọn nhu cầu trên trang chủ để xem các sản phẩm phù hợp, thay vì phải tự lọc giữa một danh mục quá rộng.",
  },
];

type PromoBanner = { image: string; alt: string; cta: string; href: string };

export function ManMattersHome({
  initialBanners = [],
  initialPromoBanners = [],
}: {
  initialBanners?: PromoBanner[];
  initialPromoBanners?: PromoBanner[];
}) {
  const [slide, setSlide] = useState(0);
  const [banners, setBanners] = useState<PromoBanner[]>(initialBanners);
  const [promoBanners, setPromoBanners] =
    useState<PromoBanner[]>(initialPromoBanners);
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>(
    [],
  );
  const [activeCategory, setActiveCategory] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menVideos, setMenVideos] = useState<{ src: string; href: string }[]>(
    defaultMenVideos.map((src) => ({ src, href: "" })),
  );
  const [concernSlots, setConcernSlots] = useState(
    concerns.map((fallback) => ({ ...fallback, image: `${asset}${fallback.image}` })),
  );
  const { addItem } = useCart();
  const router = useRouter();
  useEffect(() => {
    fetch("/api/banners?placement=home_men_videos")
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((body) => {
        const list = (body.data ?? []) as Array<{
          slotKey: string;
          videoUrl: string;
          ctaHref: string;
        }>;
        setMenVideos(
          defaultMenVideos.map((fallback, index) => {
            const match = list.find((item) => item.slotKey === `men-video-${index + 1}`);
            return {
              src: match?.videoUrl || fallback,
              href: match?.ctaHref || "",
            };
          }),
        );
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    fetch("/api/banners?placement=home_concerns")
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then(async (body) => {
        const list = (body.data ?? []) as Array<{
          slotKey: string;
          image: string;
          alt: string;
          ctaHref: string;
        }>;
        const next = concerns.map((fallback, index) => {
          const match = list.find((item) => item.slotKey === `concern-${index + 1}`);
          return {
            name: fallback.name,
            alt: match?.alt || fallback.alt,
            image: match?.image || `${asset}${fallback.image}`,
            href: match?.ctaHref || fallback.href,
          };
        });
        await preloadImages(next.map((item) => item.image));
        setConcernSlots(next);
      })
      .catch(() => undefined);
  }, []);
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
      .then(async ([bannerPayload, promoPayload, categoryPayload]) => {
        const nextBanners: PromoBanner[] = (bannerPayload.data ?? []).map(
          (banner: { image: string; alt: string; ctaLabel: string; ctaHref: string }) => ({
            image: banner.image,
            alt: banner.alt,
            cta: banner.ctaLabel,
            href: banner.ctaHref || "/shop/all",
          }),
        );
        const nextPromos: PromoBanner[] = (promoPayload.data ?? []).map(
          (banner: { image: string; alt: string; ctaLabel: string; ctaHref: string }) => ({
            image: banner.image,
            alt: banner.alt,
            cta: banner.ctaLabel,
            href: banner.ctaHref || "/shop/all",
          }),
        );
        await preloadImages([
          ...nextBanners.map((item) => item.image),
          ...nextPromos.map((item) => item.image),
        ]);
        setSlide(0);
        setBanners(nextBanners);
        setPromoBanners(nextPromos);
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
      .then((payload) =>
        setProducts(
          (payload.data ?? []).map((product: HomeProduct) => ({
            ...product,
            _id: product._id ?? product.id ?? "",
          })),
        ),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setProducts([]);
      });

    return () => controller.abort();
  }, [activeCategory]);

  useEffect(() => {
    if (!activeCategory) return;
    const controller = new AbortController();

    fetch(
      `/api/commerce/products?categorySlug=${encodeURIComponent(activeCategory)}`,
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload) =>
        setProducts(
          (payload.data ?? []).map((product: HomeProduct) => ({
            ...product,
            _id: product._id ?? product.id ?? "",
          })),
        ),
      )
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
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
        CareWise - Phân phối thuốc mọc tóc chính hãng và giải pháp trị hói đầu chuẩn y khoa
      </h1>

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
              loading="eager"
              unoptimized={isRuntimeUpload(s.image)}
            />
          ))}
          <Link
            href={banners[slide].href}
            className={styles.heroLink}
            aria-label={banners[slide].alt}
          />
          <a className={styles.heroCta} href={banners[slide].href}>
            {banners[slide].cta}
          </a>
          <div className={styles.dots}>
            {banners.map((s, index) => (
              <button
                key={s.image}
                onClick={() => setSlide(index)}
                className={index === slide ? styles.activeDot : ""}
                aria-label={`Hiển thị banner ${index + 1}`}
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
                unoptimized={isRuntimeUpload(banner.image)}
              />
            </a>
          ))}
        </section>
      )}

      <section id="concerns" className={styles.section}>
        <h2 className={styles.sectionHeading}>Chọn theo điều tóc cần</h2>
        <div className={styles.concernGrid}>
          {concernSlots.map((c) => (
            <Link href={c.href} className={styles.concern} key={c.name}>
              <Image
                src={c.image}
                alt={c.alt}
                width={640}
                height={800}
                unoptimized={isRuntimeUpload(c.image)}
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
          {products.map((p) => {
            const displayPrice = p.salePrice ?? p.price;
            const originalPrice =
              p.compareAtPrice ?? (p.salePrice ? p.price : undefined);
            return (
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
                    <strong>{formatPrice(displayPrice)}</strong>
                    {originalPrice && <del>{formatPrice(originalPrice)}</del>}
                    <em>★ {p.rating ?? "-"}</em>
                  </div>
                  <div className={styles.productActions}>
                    <button
                      className={styles.addBtn}
                      onClick={() => {
                        addItem({
                          productId: p._id ?? p.id ?? "",
                          name: p.name,
                          price: displayPrice,
                          image: p.images[0] ?? "",
                        });
                        showCartToast(`Đã thêm "${p.name}" vào giỏ hàng`);
                      }}
                    >
                      <Plus size={16} /> Thêm
                    </button>
                    <button
                      className={styles.buyBtn}
                      onClick={() => {
                        addItem({
                          productId: p._id ?? p.id ?? "",
                          name: p.name,
                          price: displayPrice,
                          image: p.images[0] ?? "",
                        });
                        showCartToast(`Đã thêm "${p.name}" · đang chuyển đến giỏ hàng`);
                        router.push("/checkout");
                      }}
                    >
                      <Zap size={16} /> Mua ngay
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="assessment" className={styles.section}>
        <div className={styles.guessworkCard}>
          <h2>Đừng để mái tóc chỉ là một phỏng đoán</h2>
          <div className={styles.stepsGrid}>
            {steps.map((s) => (
              <div className={styles.step} key={s.label}>
                <s.icon size={28} />
                <span>{s.label}</span>
                <em aria-hidden="true">{s.n}</em>
              </div>
            ))}
          </div>
          <a className={styles.guessworkCta} href="/pages/hair-form-assessment">
            Bắt đầu kiểm tra tóc <ChevronRight size={16} />
          </a>
        </div>
      </section>

      <section id="men-videos" className={styles.section}>
        <h2 className={styles.sectionHeading}>Đàn ông đích thực</h2>
        <div className={styles.menVideoGrid}>
          {menVideos.map((video, index) => {
            const player = (
              <video
                className={styles.menVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controlsList="nodownload noplaybackrate nofullscreen"
                onContextMenu={(event) => event.preventDefault()}
              >
                <source src={video.src} type="video/mp4" />
              </video>
            );
            return video.href ? (
              <Link
                key={video.src + index}
                href={video.href}
                className={styles.menVideoLink}
                aria-label="Xem sản phẩm trong video"
              >
                {player}
              </Link>
            ) : (
              <div key={video.src + index} className={styles.menVideoLink}>
                {player}
              </div>
            );
          })}
        </div>
      </section>

      <section id="reviews" className={styles.section}>
        <h2 className={styles.sectionHeading}>Chia sẻ từ khách hàng</h2>
        <div className={styles.reviews}>
          {reviews.map((r) => (
            <Image
              key={r}
              src={`${asset}${r}`}
              alt="Chia sẻ từ khách hàng Tóc Tai"
              width={500}
              height={735}
            />
          ))}
        </div>
      </section>

      <section id="routine" className={styles.section}>
        <div className={styles.experts}>
          <h2>Xây routine bằng sự thấu hiểu.</h2>
          <p>
            Chăm sóc tóc là hành trình dài. Tóc Tai giúp bạn bắt đầu đơn giản và
            duy trì thật đều đặn.
          </p>
        </div>
      </section>

      <section id="faq" className={styles.section}>
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
