"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, MapPin, X } from "lucide-react";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { notFound, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import { SiteFooter } from "@/components/sites/manmatters-com-61d14dee/shared/SiteFooter";
import { ReviewModal } from "@/components/store/ReviewModal";
import { showCartToast } from "@/components/cart/CartToast";
import { useCart } from "@/contexts/CartContext";
import styles from "./product-detail.module.css";

const MAX_VISIBLE_REVIEWS = 5;

type Item = { targetProductId?: string; targetProductSlug?: string; title?: string; label?: string; period?: string; name?: string; value?: string; description?: string; image?: string };
type Option = { id: string; targetProductSlug?: string; targetProductId?: string; label?: string; value?: string; image?: string; priceAdjustment?: number };
type OptionGroup = { id: string; title: string; code: string; displayType?: string; required?: boolean; options: Option[] };
type Product = { _id?: string; id?: string; name: string; slug: string; price: number; salePrice?: number; images: string[]; shortDescription: string; description: string; specifications?: Record<string, string | number | boolean>; specificationRows?: Item[]; category?: { name: string; slug: string }; variantGroup?: string; variantLabel?: string; optionGroups?: OptionGroup[]; stageImages?: Item[]; howToUse?: Item; rootCauses?: Item[]; detailHighlights?: Item[]; treatmentKit?: Item[]; treatmentJourney?: Item[]; contentBlocks?: Item[]; translations?: { en?: { name?: string; shortDescription?: string; description?: string; howToUseDescription?: string } } };
type Review = { _id: string; rating: number; title: string; body: string; createdAt: string; user?: { fullName: string }; guestName?: string };
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
function splitOptionLabel(label: string) { const match = label.match(/^(.*?)\s*(\(.*\))\s*$/); return match ? { main: match[1].trim(), sub: match[2].trim() } : { main: label, sub: "" }; }
function isBlank(item?: { title?: string; label?: string; name?: string; period?: string; description?: string; value?: string; image?: string }) { if (!item) return true; return !item.image && !item.title?.trim() && !item.label?.trim() && !item.name?.trim() && !item.period?.trim() && !item.description?.trim() && !item.value?.trim(); }

export function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter(); const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [activeImage, setActiveImage] = useState(0); const [selected, setSelected] = useState<Record<string, string>>({}); const [reviews, setReviews] = useState<Review[]>([]); const [loggedIn, setLoggedIn] = useState(false); const [showReviewModal, setShowReviewModal] = useState(false); const [showAllReviews, setShowAllReviews] = useState(false); const [tab, setTab] = useState<"details" | "howToUse">("details"); const [added, setAdded] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false); const [variantModalBuyNow, setVariantModalBuyNow] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false); const actionsRef = useRef<HTMLDivElement>(null);
  const [locationChecking, setLocationChecking] = useState(false); const [deliveryEstimate, setDeliveryEstimate] = useState(""); const [locationError, setLocationError] = useState("");
  const [lang, setLang] = useState<"vi" | "en">("vi");
  useEffect(() => { fetch(`/api/commerce/products/${slug}`).then((response) => response.json()).then((body) => body.data ? setProduct(body.data) : setFailed(true)).finally(() => setLoading(false)); }, [slug]);
  useEffect(() => { if (!product) return; fetch(`/api/reviews?productId=${product._id}`).then((response) => response.json()).then((body) => setReviews(body.data ?? [])); fetch("/api/auth/me").then((response) => response.json()).then((body) => setLoggedIn(Boolean(body.data))); }, [product]);
  useEffect(() => {
    const node = actionsRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { rootMargin: "-72px 0px 0px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [product]);
  if (failed) notFound(); if (loading || !product) return <><SiteHeader compact /><p style={{ padding: 80, textAlign: "center" }}>Đang tải sản phẩm...</p></>;
  const selectedOptions = (product.optionGroups ?? []).map((group) => { const option = group.options.find((entry) => (entry.value ?? entry.label ?? "") === selected[group.code]); return option ? { groupCode: group.code, groupTitle: group.title, optionValue: option.value ?? option.label ?? "", optionLabel: option.label ?? option.value ?? "", priceAdjustment: option.priceAdjustment ?? 0 } : null; }).filter(Boolean) as { groupCode: string; groupTitle: string; optionValue: string; optionLabel: string; priceAdjustment: number }[];
  const price = (product.salePrice ?? product.price) + selectedOptions.reduce((total, option) => total + option.priceAdjustment, 0);
  const currentProduct = product;
  const productId = currentProduct._id ?? currentProduct.id ?? "";
  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const en = product.translations?.en;
  const hasEnglish = Boolean(en?.name || en?.shortDescription || en?.description);
  const displayName = (lang === "en" && en?.name) || product.name;
  const displayShortDescription = (lang === "en" && en?.shortDescription) || product.shortDescription;
  const displayDescription = (lang === "en" && en?.description) || product.description;
  const displayHowToUseDescription = (lang === "en" && en?.howToUseDescription) || product.howToUse?.description;
  function choose(group: OptionGroup, option: Option) { if (option.targetProductSlug) { router.push(`/san-pham/${option.targetProductSlug}`); return; } setSelected((current) => ({ ...current, [group.code]: option.value ?? option.label ?? "" })); }
  function addToCart(buyNow: boolean) {
    const missing = groups.find((group) => group.required && !selected[group.code]);
    if (missing) { setVariantModalBuyNow(buyNow); setVariantModalOpen(true); return; }
    if (!productId) { setLocationError("Không xác định được mã sản phẩm. Vui lòng tải lại trang."); return; }
    addItem({ productId, name: currentProduct.name, price, image: currentProduct.images[0] ?? "", variantTitle: selectedOptions.map((option) => option.optionLabel).join(" / "), options: selectedOptions });
    setVariantModalOpen(false);
    if (buyNow) { showCartToast(`Đã thêm "${currentProduct.name}" · đang chuyển đến giỏ hàng`); router.push("/checkout"); } else { showCartToast(`Đã thêm "${currentProduct.name}" vào giỏ hàng`); setAdded(true); setTimeout(() => setAdded(false), 1600); }
  }
  function formatEstimate(date: Date) {
    return date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function checkLocation() {
    if (!("geolocation" in navigator)) { setLocationError("Trình duyệt không hỗ trợ định vị."); return; }
    setLocationChecking(true); setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, { headers: { Accept: "application/json" } });
          const body = await response.json();
          const address = body?.address ?? {};
          const city: string = address.city || address.state || address.town || "";
          const eta = new Date(); eta.setDate(eta.getDate() + 2);
          setDeliveryEstimate(`Nhận trước ${formatEstimate(eta)}${city ? ` · giao đến ${city}` : ""}`);
        } catch {
          const eta = new Date(); eta.setDate(eta.getDate() + 2);
          setDeliveryEstimate(`Nhận trước ${formatEstimate(eta)} (ước tính)`);
        } finally { setLocationChecking(false); }
      },
      () => {
        setLocationChecking(false);
        const eta = new Date(); eta.setDate(eta.getDate() + 2);
        setDeliveryEstimate(`Nhận trước ${formatEstimate(eta)} (không truy cập được vị trí)`);
      },
      { timeout: 8000 },
    );
  }
  function renderSteps() {
    return groups.map((group, index) => (
      <div className={styles.step} key={group.id}>
        <h2>Bước {index + 1}{group.title ? `: ${group.title}` : ""}</h2>
        <div className={styles.optionRow}>
          {group.options.map((option) => {
            const value = option.value ?? option.label ?? "";
            const isSelected = selected[group.code] === value;
            if (option.image && group.displayType === "card") {
              const { main, sub } = splitOptionLabel(option.label ?? "");
              return (
                <button type="button" key={option.id} className={`${styles.imageOption} ${isSelected ? styles.selected : ""}`} onClick={() => choose(group, option)}>
                  <span className={styles.imageOptionImg}><Image src={option.image} alt="" fill sizes="82px" style={{ objectFit: "contain" }} quality={92} /></span>
                  <span className={styles.imageOptionMain}>{main}</span>
                  {sub && <span className={styles.imageOptionSub}>{sub}</span>}
                </button>
              );
            }
            const absolutePrice = (currentProduct.salePrice ?? currentProduct.price) + (option.priceAdjustment ?? 0);
            return (
              <button type="button" key={option.id} className={`${styles.option} ${isSelected ? styles.selected : ""}`} onClick={() => choose(group, option)}>
                {option.label}{option.priceAdjustment ? ` – ${money.format(absolutePrice)}` : ""}
              </button>
            );
          })}
        </div>
      </div>
    ));
  }
  const stageImages = (product.stageImages ?? []).filter((item) => !isBlank(item));
  const fallbackGroups: OptionGroup[] = stageImages.length ? [{ id: "stages", title: "Chọn tình trạng tóc / loại da đầu", code: "stage", displayType: "card", options: stageImages.map((item, index) => ({ id: `stage-${index}`, label: item.title || item.label || `Giai đoạn ${index + 1}`, value: item.label || item.title || `stage-${index}`, image: item.image, targetProductId: item.targetProductId, targetProductSlug: item.targetProductSlug })) }] : [];
  const cleanedOptionGroups = (product.optionGroups ?? []).map((group) => ({ ...group, options: group.options.filter((option) => !isBlank(option)) })).filter((group) => group.options.length > 0);
  const groups = [...fallbackGroups, ...cleanedOptionGroups];
  const hasHowToUse = !isBlank(product.howToUse);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, MAX_VISIBLE_REVIEWS);

  return (
    <div className={styles.page}>
      <SiteHeader compact />
      <main className={styles.main}>
        <div className={styles.crumbs}>
          <Link href="/cua-hang">Cửa hàng</Link> <span>/</span> {product.category?.name} <span>/</span> {displayName}
          {hasEnglish && (
            <div className={styles.langSwitch}>
              <button type="button" className={lang === "vi" ? styles.langActive : ""} onClick={() => setLang("vi")}>VI</button>
              <button type="button" className={lang === "en" ? styles.langActive : ""} onClick={() => setLang("en")}>EN</button>
            </div>
          )}
        </div>
        <div className={styles.purchase}>
          <section className={styles.gallery}>
            <div className={styles.thumbs}>
              {product.images.map((image, index) => (
                <button className={`${styles.thumb} ${index === activeImage ? styles.active : ""}`} key={`${image}-${index}`} onClick={() => setActiveImage(index)} aria-label={`Ảnh sản phẩm ${index + 1}`}>
                  <Image src={image} alt="" width={62} height={68} unoptimized={image.startsWith("/uploads/")} />
                </button>
              ))}
              {product.images.length > 4 && <span className={styles.thumbMore}>↓</span>}
            </div>
            <div className={styles.hero}>
              {product.images[activeImage] ? (
                <Image src={product.images[activeImage]} alt={displayName} fill priority sizes="(max-width: 900px) 100vw, 50vw" unoptimized={product.images[activeImage].startsWith("/uploads/")} />
              ) : (
                <div className={styles.heroFallback}>{product.category?.name}</div>
              )}
            </div>
          </section>
          <section className={styles.summary}>
            {displayShortDescription && <p className={styles.eyebrow}>{displayShortDescription}</p>}
            <h1>{displayName}</h1>
            <div className={styles.priceRow}>
              <span className={styles.price}>{money.format(price)}</span>
              {product.salePrice && <span className={styles.compare}>{money.format(product.price)}</span>}
              <span className={styles.discount}>{product.salePrice ? `Giảm ${Math.round((1 - product.salePrice / product.price) * 100)}%` : "Bán chạy"}</span>
            </div>
            <p className={styles.tax}>Đã bao gồm thuế</p>
            <div className={styles.ratingRow}>
              <b>{avgRating ? avgRating.toFixed(1) : "4.0"}</b>
              <span className={styles.stars}>★★★★☆</span>
              <span>▣ {reviews.length ? `${reviews.length} đánh giá` : "1.3M đã bán"}</span>
              <a className={styles.ratingLink} href="#reviews">☆ {reviews.length || "1.3K"} Đánh giá</a>
            </div>
            <div className={styles.steps}>{renderSteps()}</div>
            <div className={styles.details}>
              <div className={styles.tabs}>
                <button className={`${styles.tab} ${tab === "details" ? styles.tabActive : ""}`} onClick={() => setTab("details")}>Chi tiết</button>
                {hasHowToUse && <button className={`${styles.tab} ${tab === "howToUse" ? styles.tabActive : ""}`} onClick={() => setTab("howToUse")}>Cách sử dụng?</button>}
              </div>
              <div className={styles.tabPanel}>
                {tab === "details" || !hasHowToUse ? (
                  <>
                    <p>{displayDescription || (lang === "en" ? "Product details coming soon." : "Thông tin chi tiết sản phẩm đang được cập nhật.")}</p>
                    {(() => {
                      const kit = (product.treatmentKit ?? []).filter((item) => !isBlank(item));
                      return kit.length ? (
                        <>
                          <p>Bộ điều trị này bao gồm:</p>
                          <ul>{kit.map((item, index) => <li key={index}><b>{item.name || item.title}</b>{item.description && ` – ${item.description}`}</li>)}</ul>
                        </>
                      ) : null;
                    })()}
                    {(() => {
                      const highlights = (product.detailHighlights ?? []).filter((item) => !isBlank(item));
                      return highlights.length ? (
                        <div className={styles.highlightRow}>
                          {highlights.map((item, index) => (
                            <div className={styles.highlightItem} key={index}>
                              {item.image && <span className={styles.highlightIcon}><Image src={item.image} alt="" fill sizes="40px" style={{ objectFit: "contain" }} /></span>}
                              <span>{item.name || item.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <>
                    {displayHowToUseDescription && <p>{displayHowToUseDescription}</p>}
                    {product.howToUse?.image && (
                      <div className={styles.howToImage}>
                        <Image src={product.howToUse.image} alt="Cách sử dụng" fill sizes="(max-width: 640px) 100vw, 560px" style={{ objectFit: "contain" }} quality={92} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className={styles.actions} ref={actionsRef}>
              <button className={styles.add} onClick={() => addToCart(false)}>{added ? "Đã thêm ✓" : "Thêm vào giỏ"}</button>
              <button className={styles.buy} onClick={() => addToCart(true)}>Mua ngay</button>
            </div>
            <div className={styles.delivery}>
              <b>📍 Chọn địa điểm giao hàng</b>
              <br />
              Nhập địa chỉ để nhận thời gian giao chính xác.
            </div>
          </section>
        </div>

        <ProductContent product={product} />

        <section id="reviews" className={styles.contentSection}>
          <h2>Đánh giá sản phẩm {reviews.length ? `(${reviews.length})` : ""}</h2>
          {reviews.length === 0 ? (
            <p className={styles.reviewEmpty}>Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className={styles.reviewList}>
              {visibleReviews.map((review) => (
                <div key={review._id} className={styles.contentCard}>
                  <div className={styles.reviewHead}>
                    <b>{review.user?.fullName ?? review.guestName ?? "Khách hàng"} <CheckCircle2 size={14} className={styles.verifiedIcon} /></b>
                    <small>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</small>
                  </div>
                  <span className={styles.stars}>{"★".repeat(review.rating)}</span>
                  {review.title && <h3 className={styles.reviewTitle}>{review.title}</h3>}
                  <p>{review.body}</p>
                </div>
              ))}
            </div>
          )}
          <div className={styles.reviewActions}>
            {reviews.length > MAX_VISIBLE_REVIEWS && (
              <button className={styles.reviewSecondaryButton} onClick={() => setShowAllReviews((value) => !value)}>
                {showAllReviews ? "Thu gọn đánh giá" : "Xem thêm đánh giá"}
              </button>
            )}
            <button className={styles.reviewPrimaryButton} onClick={() => setShowReviewModal(true)}>Viết đánh giá</button>
          </div>
        </section>
      </main>
      <SiteFooter />

      <div className={`${styles.stickyBar} ${stickyVisible && !variantModalOpen ? styles.stickyVisible : ""}`}>
        <div className={styles.stickyLocationRow}>
          <span className={styles.stickyLocationText}>
            <MapPin size={13} />
            {deliveryEstimate || locationError || "Kiểm tra vị trí để xem thời gian nhận hàng dự kiến"}
          </span>
          <button type="button" className={styles.stickyLocationButton} onClick={checkLocation} disabled={locationChecking}>
            {locationChecking ? <Loader2 size={12} className="animate-spin" /> : null}
            {locationChecking ? "Đang kiểm tra..." : deliveryEstimate ? "Kiểm tra lại" : "Kiểm tra vị trí"}
          </button>
        </div>
        <div className={styles.stickyMainRow}>
          <div className={styles.stickyProduct}>
            {product.images[0] && (
              <div className={styles.stickyThumb}>
                <Image src={product.images[0]} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
              </div>
            )}
            <div className={styles.stickyInfo}>
              <b>{displayName}</b>
              <span>{money.format(price)}</span>
            </div>
          </div>
          <div className={styles.stickyActions}>
            <button className={styles.add} onClick={() => addToCart(false)}>{added ? "Đã thêm ✓" : "Thêm vào giỏ"}</button>
            <button className={styles.buy} onClick={() => addToCart(true)}>Mua ngay</button>
          </div>
        </div>
      </div>

      {variantModalOpen && (
        <div className={styles.variantModalBackdrop} onClick={() => setVariantModalOpen(false)}>
          <div className={styles.variantModal} onClick={(event) => event.stopPropagation()}>
            <header className={styles.variantModalHeader}>
              <div className={styles.stickyProduct}>
                {product.images[0] && (
                  <div className={styles.stickyThumb}>
                    <Image src={product.images[0]} alt="" fill sizes="48px" style={{ objectFit: "cover" }} unoptimized={product.images[0].startsWith("/uploads/")} />
                  </div>
                )}
                <div className={styles.stickyInfo}>
                  <b>{displayName}</b>
                  <span>{money.format(price)}</span>
                </div>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setVariantModalOpen(false)}><X size={16} /></button>
            </header>
            <p className={styles.variantModalHint}>Vui lòng chọn đầy đủ tùy chọn bên dưới trước khi {variantModalBuyNow ? "mua ngay" : "thêm vào giỏ"}.</p>
            <div className={styles.steps}>{renderSteps()}</div>
            <button className={styles.buy} style={{ width: "100%" }} onClick={() => addToCart(variantModalBuyNow)}>Xác nhận lựa chọn</button>
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewModal
          productId={productId}
          productName={displayName}
          productImage={product.images[0]}
          loggedIn={loggedIn}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={(review) => setReviews((current) => [review, ...current])}
        />
      )}
    </div>
  );
}

const contentImageSizes = "(max-width: 640px) 100vw, (max-width: 1180px) 45vw, 500px";

function ScrollRow({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = Children.count(children);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    function measure() {
      if (!node) return;
      setCanScroll(node.scrollWidth > node.clientWidth + 4);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !canScroll) return;
    function onScroll() {
      if (!node) return;
      const items = Array.from(node.children) as HTMLElement[];
      let closest = 0;
      let closestDist = Infinity;
      items.forEach((item, index) => {
        const dist = Math.abs(item.offsetLeft - node.scrollLeft);
        if (dist < closestDist) {
          closestDist = dist;
          closest = index;
        }
      });
      setActiveIndex(closest);
    }
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [canScroll]);

  function go(direction: number) {
    const node = scrollRef.current;
    if (!node) return;
    const items = Array.from(node.children) as HTMLElement[];
    const nextIndex = Math.min(Math.max(activeIndex + direction, 0), items.length - 1);
    items[nextIndex]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div className={styles.scrollRowWrap}>
      <div className={styles.contentGrid} ref={scrollRef}>
        {children}
      </div>
      {canScroll && (
        <div className={styles.scrollNav}>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={activeIndex === 0}
            aria-label="Xem mục trước"
          >
            <ChevronLeft size={16} />
          </button>
          <div className={styles.scrollDots}>
            {Array.from({ length: count }).map((_, index) => (
              <span
                key={index}
                className={index === activeIndex ? styles.scrollDotActive : styles.scrollDot}
              />
            ))}
          </div>
          <span className={styles.scrollCount}>
            {activeIndex + 1}/{count}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={activeIndex === count - 1}
            aria-label="Xem mục tiếp theo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function ProductContent({ product }: { product: Product }) {
  const specRows = (product.specificationRows ?? []).filter((item) => !isBlank(item));
  const groups: Array<[string, Item[]]> = [["Mô tả nguyên nhân", product.rootCauses], ["Bộ điều trị", product.treatmentKit], ["Lộ trình điều trị", product.treatmentJourney], ["Nội dung bổ sung", product.contentBlocks]].map(([title, items]) => [title as string, (items as Item[] | undefined ?? []).filter((item) => !isBlank(item))]);
  return <div className={styles.contentBlocks}>
    {specRows.length ? <section className={styles.contentSection}><h2>Thông số sản phẩm</h2><ScrollRow>{specRows.map((item, index) => <article className={styles.contentCard} key={index}>{item.image && <div className={styles.contentCardImage}><Image src={item.image} alt="" fill sizes={contentImageSizes} style={{ objectFit: "contain" }} quality={92} /></div>}{item.name && <h3>{item.name}</h3>}{item.value && <p>{item.value}</p>}</article>)}</ScrollRow></section> : null}
    {groups.map(([title, items]) => items.length ? <section className={styles.contentSection} key={title}><h2>{title}</h2><ScrollRow>{items.map((item, index) => { const titleText = item.title || item.name || item.period; const card = <>{item.image && <div className={styles.contentCardImage}><Image src={item.image} alt="" fill sizes={contentImageSizes} style={{ objectFit: "contain" }} quality={92} /></div>}{titleText && <h3>{titleText}</h3>}{item.description && <p>{item.description}</p>}</>; return item.targetProductSlug ? <Link href={`/san-pham/${item.targetProductSlug}`} className={styles.contentCard} key={index}>{card}</Link> : <article className={styles.contentCard} key={index}>{card}</article>; })}</ScrollRow></section> : null)}
  </div>;
}
