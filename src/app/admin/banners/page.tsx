"use client";

import { Check, Film, ImagePlus, Megaphone, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableToolbar } from "@/components/admin/AdminTableTools";
import { UploadField } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";

const SITE_BAR_SLOT_KEY = "site-announcement-bar";
const MEN_VIDEO_SLOT_PREFIX = "men-video-";
const ASSESSMENT_VIDEO_SLOT_PREFIX = "assessment-video-";
const CONCERN_SLOT_PREFIX = "concern-";
const CONCERN_LABELS = ["Tóc", "Râu", "Da", "Dinh dưỡng"];
const CONTACT_SLOTS = [
  { key: "contact-zalo", label: "Nút Zalo", placeholder: "https://zalo.me/0901234567" },
  { key: "contact-call", label: "Nút gọi điện", placeholder: "tel:0901234567" },
  { key: "contact-fanpage", label: "Nút Fanpage", placeholder: "https://facebook.com/..." },
] as const;
const DEFAULT_MEN_VIDEOS = [
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8e4e7b5ab468e85ba/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8a151fd521855d7fa/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8a151fd521855d7f5/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8eda64ba028b64bc9/main.mp4",
];
const DEFAULT_ASSESSMENT_VIDEOS = [
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c398649c9137d0ba3c14/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c398649c9137d0ba3c18/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c452749a2a229b7e00f6/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c4529981f11df328a048/main.mp4",
];
const HOME_VIDEO_MANAGER: VideoManager = {
  title: "Video \"Đàn ông đích thực\"",
  description: "4 video nằm ngang ở trang chủ. Có thể thay video và gắn sản phẩm.",
  prefix: MEN_VIDEO_SLOT_PREFIX,
  placement: "home_men_videos",
  pageKey: "home",
  altPrefix: "Video Đàn ông đích thực",
  defaults: DEFAULT_MEN_VIDEOS,
};
const ASSESSMENT_VIDEO_MANAGER: VideoManager = {
  title: "Video khách hàng · Trang kiểm tra tóc",
  description: "4 video trong mục khách hàng chia sẻ. Ngoài website video tự phát lặp, không thể tua hoặc dừng.",
  prefix: ASSESSMENT_VIDEO_SLOT_PREFIX,
  placement: "hair_assessment_videos",
  pageKey: "hair-assessment",
  altPrefix: "Video khách hàng theo lộ trình cá nhân hóa",
  defaults: DEFAULT_ASSESSMENT_VIDEOS,
};

type Banner = {
  _id: string;
  pageKey: string;
  slotKey: string;
  placement: "home_hero" | "home_promo" | "all_products" | "category" | "site_bar" | "home_men_videos" | "hair_assessment_videos" | "home_concerns" | "site_contact_buttons";
  categorySlug: string;
  image: string;
  mobileImage: string;
  videoUrl: string;
  alt: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  sortOrder: number;
};
type ProductOption = { id: string; slug: string; name: string };
type VideoPlacement = "home_men_videos" | "hair_assessment_videos";
type VideoManager = {
  title: string;
  description: string;
  prefix: string;
  placement: VideoPlacement;
  pageKey: string;
  altPrefix: string;
  defaults: string[];
};
function slugFromCtaHref(href?: string) {
  return href?.match(/^\/san-pham\/(.+)$/)?.[1] ?? "";
}
type Slot = {
  key: string;
  page: string;
  label: string;
  placement: Banner["placement"];
  categorySlug?: string;
  defaultAlt: string;
  defaultHref: string;
  sort: number;
};

const homeSlots: Slot[] = [1, 2, 3].map((number) => ({
  key: `home-hero-${number}`,
  page: "Trang chủ",
  label: `Banner trang chủ ${number}`,
  placement: "home_hero",
  defaultAlt: `Banner trang chủ ${number}`,
  defaultHref: "/shop/all",
  sort: number - 1,
}));
const homeConcernSlots: Slot[] = CONCERN_LABELS.map((label, index) => ({
  key: `${CONCERN_SLOT_PREFIX}${index + 1}`,
  page: "Trang chủ",
  label: `Chủ đề ${index + 1}: ${label}`,
  placement: "home_concerns",
  defaultAlt: label,
  defaultHref: "/shop/all",
  sort: index,
}));
function normalize(value: string) {
  return value.toLocaleLowerCase("vi-VN");
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [hrefDrafts, setHrefDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [barText, setBarText] = useState("");
  const [barCtaLabel, setBarCtaLabel] = useState("");
  const [barCtaHref, setBarCtaHref] = useState("");
  const [barSaving, setBarSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [contactHrefs, setContactHrefs] = useState<Record<string, string>>({});
  const [contactSaving, setContactSaving] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    setLoading(true);
    const bannerResponse = await fetch("/api/banners?placement=all&all=true");
    const bannerBody = await bannerResponse.json();
    const list: Banner[] = bannerBody.data ?? [];
    setBanners(list);
    const bar = list.find((banner) => banner.slotKey === SITE_BAR_SLOT_KEY);
    setBarText(bar?.title ?? "MIỄN PHÍ VẬN CHUYỂN CHO ĐƠN HÀNG TỪ 499.000đ");
    setBarCtaLabel(bar?.ctaLabel ?? "Khám phá sản phẩm");
    setBarCtaHref(bar?.ctaHref ?? "/shop/all");
    setContactHrefs(
      Object.fromEntries(
        CONTACT_SLOTS.map(({ key }) => [
          key,
          list.find((banner) => banner.slotKey === key)?.ctaHref ?? "",
        ]),
      ),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
    fetch("/api/commerce/products?status=all")
      .then((response) => response.json())
      .then((body) =>
        setProductOptions(
          (body.data ?? []).map(
            (product: { _id?: string; id?: string; slug: string; name: string }) => ({
              id: String(product._id ?? product.id),
              slug: product.slug,
              name: product.name,
            }),
          ),
        ),
      )
      .catch(() => undefined);
  }, []);

  async function saveSiteBar() {
    setBarSaving(true);
    setMessage("");
    const current = banners.find((banner) => banner.slotKey === SITE_BAR_SLOT_KEY);
    const payload = {
      pageKey: "global",
      slotKey: SITE_BAR_SLOT_KEY,
      placement: "site_bar" as const,
      alt: "Thanh thông báo đầu trang",
      title: barText,
      ctaLabel: barCtaLabel,
      ctaHref: barCtaHref,
      isActive: true,
      sortOrder: 0,
    };
    try {
      const response = await fetch(
        current ? `/api/banners/${current._id}` : "/api/banners",
        {
          method: current ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("Không thể lưu thanh thông báo");
      setMessage("Đã lưu thanh thông báo đầu trang.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu thất bại");
    } finally {
      setBarSaving(false);
    }
  }

  async function saveContactButtons() {
    setContactSaving(true);
    setMessage("");
    try {
      const responses = await Promise.all(
        CONTACT_SLOTS.map(({ key, label }) => {
          const current = banners.find((banner) => banner.slotKey === key);
          const ctaHref = contactHrefs[key]?.trim() ?? "";
          const payload = current
            ? { ctaHref }
            : {
                pageKey: "global",
                slotKey: key,
                placement: "site_contact_buttons" as const,
                alt: label,
                ctaHref,
                isActive: true,
                sortOrder: 0,
              };
          return fetch(current ? `/api/banners/${current._id}` : "/api/banners", {
            method: current ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }),
      );
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        const body = await failed.json().catch(() => ({}));
        throw new Error(body.error ?? "Không thể lưu nút liên hệ");
      }
      setMessage("Đã lưu các nút liên hệ.");
      await load();
    } catch {
      setMessage("Lưu nút liên hệ thất bại");
    } finally {
      setContactSaving(false);
    }
  }

  function videoBanner(prefix: string, index: number) {
    return banners.find((banner) => banner.slotKey === `${prefix}${index + 1}`);
  }

  async function uploadManagedVideo(config: VideoManager, index: number, file: File) {
    const inputKey = `${config.prefix}${index}`;
    setVideoUploading(inputKey);
    setMessage("");
    try {
      const current = videoBanner(config.prefix, index);
      const previousUrl = current?.videoUrl ?? "";
      const form = new FormData();
      form.append("file", file);
      form.append("previousUrl", previousUrl);
      const uploadResponse = await fetch("/api/admin/uploads/video", { method: "POST", body: form });
      const uploadBody = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadBody.error ?? "Upload video thất bại");
      const payload = {
        pageKey: config.pageKey,
        slotKey: `${config.prefix}${index + 1}`,
        placement: config.placement,
        mediaType: "video" as const,
        videoUrl: uploadBody.data.url,
        alt: `${config.altPrefix} ${index + 1}`,
        isActive: true,
        sortOrder: index,
      };
      const saveResponse = await fetch(
        current ? `/api/banners/${current._id}` : "/api/banners",
        {
          method: current ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!saveResponse.ok) throw new Error("Không thể lưu video");
      setMessage(`Đã thay video ${index + 1}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload video thất bại");
    } finally {
      setVideoUploading(null);
    }
  }

  async function saveManagedVideoLink(config: VideoManager, index: number, productSlug: string) {
    setMessage("");
    const current = videoBanner(config.prefix, index);
    const ctaHref = productSlug ? `/san-pham/${productSlug}` : "";
    const payload = current
      ? { ctaHref }
      : {
          pageKey: config.pageKey,
          slotKey: `${config.prefix}${index + 1}`,
          placement: config.placement,
          mediaType: "video" as const,
          videoUrl: "",
          ctaHref,
          alt: `${config.altPrefix} ${index + 1}`,
          isActive: true,
          sortOrder: index,
        };
    try {
      const response = await fetch(
        current ? `/api/banners/${current._id}` : "/api/banners",
        {
          method: current ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("Không thể lưu liên kết sản phẩm");
      setMessage(
        productSlug
          ? `Đã gắn sản phẩm cho video ${index + 1}.`
          : `Đã gỡ liên kết sản phẩm khỏi video ${index + 1}.`,
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu liên kết thất bại");
    }
  }

  const slots = useMemo(() => [...homeSlots], []);
  const concernSlots = useMemo(() => [...homeConcernSlots], []);

  const filteredSlots = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return slots;
    return slots.filter((slot) =>
      normalize(`${slot.page} ${slot.label} ${slot.categorySlug ?? ""}`).includes(
        term,
      ),
    );
  }, [search, slots]);

  function existing(slot: Slot) {
    return (
      banners.find((banner) => banner.slotKey === slot.key) ??
      banners.find(
        (banner) =>
          banner.placement === slot.placement &&
          (slot.categorySlug
            ? banner.categorySlug === slot.categorySlug
            : !banner.categorySlug) &&
          banner.sortOrder === slot.sort,
      )
    );
  }

  async function saveSlot(slot: Slot) {
    const image = drafts[slot.key] ?? existing(slot)?.image ?? "";
    if (!image) {
      setMessage(`Hãy upload ảnh cho ${slot.label}.`);
      return;
    }
    const current = existing(slot);
    setSaving(slot.key);
    setMessage("");
    const payload = {
      pageKey: slot.page.toLowerCase().replaceAll(" ", "-"),
      slotKey: slot.key,
      placement: slot.placement,
      categorySlug: slot.categorySlug ?? "",
      image,
      mobileImage: current?.mobileImage ?? "",
      alt: current?.alt || slot.defaultAlt,
      title: current?.alt || slot.defaultAlt,
      subtitle: "",
      ctaLabel: "Khám phá ngay",
      ctaHref: hrefDrafts[slot.key] ?? current?.ctaHref ?? slot.defaultHref,
      isActive: true,
      sortOrder: slot.sort,
    };
    try {
      const response = await fetch(
        current ? `/api/banners/${current._id}` : "/api/banners",
        {
          method: current ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("Không thể lưu banner");
      setMessage(`Đã lưu ${slot.label}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu banner thất bại");
    } finally {
      setSaving(null);
    }
  }

  async function removeSlot(slot: Slot) {
    const current = existing(slot);
    if (!current || !window.confirm(`Ẩn ${slot.label}?`)) return;
    await fetch(`/api/banners/${current._id}`, { method: "DELETE" });
    await load();
  }

  function renderVideoManager(config: VideoManager) {
    return (
      <div className={panel.panel} style={{ marginBottom: 16 }}>
        <div className={panel.panelPad}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Film size={18} />
            <div>
              <b style={{ display: "block", fontSize: 14 }}>{config.title}</b>
              <span style={{ fontSize: 12, color: "var(--admin-muted, #667085)" }}>
                {config.description}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
            {[0, 1, 2, 3].map((index) => {
              const banner = videoBanner(config.prefix, index);
              const videoUrl = banner?.videoUrl || config.defaults[index];
              const isCustom = Boolean(banner?.videoUrl);
              const inputKey = `${config.prefix}${index}`;
              return (
                <div key={inputKey} style={{ border: "1px solid var(--admin-border, #eaecf0)", borderRadius: 12, padding: 10 }}>
                  <video src={videoUrl} controls muted style={{ width: "100%", aspectRatio: "9/16", borderRadius: 8, background: "#000", objectFit: "cover" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <b style={{ fontSize: 12.5 }}>Video {index + 1}</b>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: isCustom ? "#12805c" : "var(--admin-faint, #98a2b3)" }}>
                      {isCustom ? "Đã tùy chỉnh" : "Mặc định"}
                    </span>
                  </div>
                  <label style={{ display: "block", marginTop: 8, fontSize: 11, fontWeight: 700, color: "var(--admin-muted, #667085)" }}>
                    Gắn sản phẩm khi bấm video
                    <select
                      value={slugFromCtaHref(banner?.ctaHref)}
                      onChange={(event) => void saveManagedVideoLink(config, index, event.target.value)}
                      style={{ width: "100%", marginTop: 4, fontWeight: 500 }}
                    >
                      <option value="">— Không gắn sản phẩm —</option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.slug}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    ref={(element) => { fileInputs.current[inputKey] = element; }}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    style={{ display: "none" }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadManagedVideo(config, index, file);
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className={panel.secondaryButton}
                    disabled={videoUploading === inputKey}
                    onClick={() => fileInputs.current[inputKey]?.click()}
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    {videoUploading === inputKey ? "Đang tải lên..." : (<><Upload size={13} /> Thay video</>)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderSection(title: string, list: Slot[]) {
    return (
      <section className="banner-slot-section">
        <div className="banner-slot-heading">
          <div>
            <p>QUẢN LÝ THEO VỊ TRÍ</p>
            <h2>{title}</h2>
          </div>
          <span>{list.length} vị trí</span>
        </div>
        <div className="banner-slot-grid">
          {list.map((slot) => {
            const current = existing(slot);
            const image = drafts[slot.key] ?? current?.image ?? "";
            return (
              <article className="banner-slot-card" key={slot.key}>
                <div className="banner-slot-preview">
                  {image ? (
                    <img src={image} alt={slot.defaultAlt} />
                  ) : (
                    <div>
                      <ImagePlus size={25} />
                      <span>Chưa có ảnh</span>
                    </div>
                  )}
                  <b>{slot.label}</b>
                </div>
                <div className="banner-slot-meta">
                  <strong>{slot.page}</strong>
                  {slot.categorySlug && <small>/{slot.categorySlug}</small>}
                </div>
                <UploadField
                  value={image}
                  onChange={(value) =>
                    setDrafts((draft) => ({ ...draft, [slot.key]: value }))
                  }
                  label={image ? "Thay ảnh" : "Upload ảnh"}
                />
                <label style={{ display: "block", marginTop: 8, fontSize: 11, fontWeight: 700, color: "var(--admin-muted, #667085)" }}>
                  Link khi bấm vào ảnh
                  <input
                    value={hrefDrafts[slot.key] ?? current?.ctaHref ?? slot.defaultHref}
                    onChange={(event) =>
                      setHrefDrafts((draft) => ({ ...draft, [slot.key]: event.target.value }))
                    }
                    placeholder="/shop/all hoặc /san-pham/ten-san-pham"
                    style={{ width: "100%", marginTop: 4, fontWeight: 500 }}
                  />
                </label>
                <div className="banner-slot-actions">
                  <button
                    className={panel.saveButton}
                    disabled={saving === slot.key || !image}
                    onClick={() => void saveSlot(slot)}
                  >
                    {saving === slot.key ? (
                      "Đang lưu..."
                    ) : (
                      <>
                        <Save size={14} /> Lưu vị trí
                      </>
                    )}
                  </button>
                  {current && (
                    <button
                      className={`${panel.iconButton} ${panel.dangerIconButton}`}
                      onClick={() => void removeSlot(slot)}
                      aria-label="Ẩn banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {current?.isActive && (
                  <span className="banner-live">
                    <Check size={12} /> Đang hiển thị
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <AdminShell breadcrumb="Banner hệ thống">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / NỘI DUNG</p>
          <h1>Banner hệ thống</h1>
          <span className="banner-subtitle">
            Chọn đúng vị trí cần thay ảnh. Không tạo nhầm banner, không phải nhớ
            slot.
          </span>
        </div>
      </div>
      {message && <p className={panel.message}>{message}</p>}
      {loading ? (
        <p className={panel.empty}>Đang tải các vị trí banner...</p>
      ) : (
        <>
          <div className={panel.panel} style={{ marginBottom: 16 }}>
            <div className={panel.panelPad}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Megaphone size={18} />
                <div>
                  <b style={{ display: "block", fontSize: 14 }}>Thanh thông báo đầu trang</b>
                  <span style={{ fontSize: 12, color: "var(--admin-muted, #667085)" }}>
                    Dòng chữ chạy ngang trên cùng mọi trang (VD: miễn phí vận chuyển).
                  </span>
                </div>
              </div>
              <div className={panel.grid2}>
                <label style={{ gridColumn: "1 / -1" }}>
                  Nội dung
                  <input value={barText} onChange={(event) => setBarText(event.target.value)} placeholder="Miễn phí vận chuyển cho đơn hàng từ 499.000đ" />
                </label>
                <label>
                  Nhãn nút
                  <input value={barCtaLabel} onChange={(event) => setBarCtaLabel(event.target.value)} placeholder="Khám phá sản phẩm" />
                </label>
                <label>
                  Link khi bấm nút
                  <input value={barCtaHref} onChange={(event) => setBarCtaHref(event.target.value)} placeholder="/shop/all" />
                </label>
              </div>
              <button className={panel.saveButton} disabled={barSaving} onClick={() => void saveSiteBar()} style={{ marginTop: 12 }}>
                {barSaving ? "Đang lưu..." : (<><Save size={14} /> Lưu thanh thông báo</>)}
              </button>
            </div>
          </div>

          <div className={panel.panel} style={{ marginBottom: 16 }}>
            <div className={panel.panelPad}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Film size={18} />
                <div>
                  <b style={{ display: "block", fontSize: 14 }}>Video &quot;Đàn ông đích thực&quot;</b>
                  <span style={{ fontSize: 12, color: "var(--admin-muted, #667085)" }}>
                    4 video nằm ngang ở trang chủ. Upload video mới sẽ tự thay thế và xoá video cũ đã tải lên (không xoá được video mặc định).
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                {[0, 1, 2, 3].map((index) => {
                  const banner = videoBanner(MEN_VIDEO_SLOT_PREFIX, index);
                  const videoUrl = banner?.videoUrl || DEFAULT_MEN_VIDEOS[index];
                  const isCustom = Boolean(banner?.videoUrl);
                  const inputKey = `${MEN_VIDEO_SLOT_PREFIX}${index}`;
                  return (
                    <div key={index} style={{ border: "1px solid var(--admin-border, #eaecf0)", borderRadius: 12, padding: 10 }}>
                      <video src={videoUrl} controls muted style={{ width: "100%", aspectRatio: "9/16", borderRadius: 8, background: "#000", objectFit: "cover" }} />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <b style={{ fontSize: 12.5 }}>Video {index + 1}</b>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: isCustom ? "#12805c" : "var(--admin-faint, #98a2b3)" }}>
                          {isCustom ? "Đã tuỳ chỉnh" : "Mặc định"}
                        </span>
                      </div>
                      <label style={{ display: "block", marginTop: 8, fontSize: 11, fontWeight: 700, color: "var(--admin-muted, #667085)" }}>
                        Gắn sản phẩm khi bấm video
                        <select
                          value={slugFromCtaHref(banner?.ctaHref)}
                          onChange={(event) => void saveManagedVideoLink(HOME_VIDEO_MANAGER, index, event.target.value)}
                          style={{ width: "100%", marginTop: 4, fontWeight: 500 }}
                        >
                          <option value="">— Không gắn sản phẩm —</option>
                          {productOptions.map((product) => (
                            <option key={product.id} value={product.slug}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <input
                        ref={(element) => { fileInputs.current[inputKey] = element; }}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        style={{ display: "none" }}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadManagedVideo(HOME_VIDEO_MANAGER, index, file);
                          event.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className={panel.secondaryButton}
                        disabled={videoUploading === inputKey}
                        onClick={() => fileInputs.current[inputKey]?.click()}
                        style={{ width: "100%", marginTop: 8 }}
                      >
                        {videoUploading === inputKey ? "Đang tải lên..." : (<><Upload size={13} /> Thay video</>)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {renderVideoManager(ASSESSMENT_VIDEO_MANAGER)}

          <div className={panel.panel} style={{ marginBottom: 16 }}>
            <div className={panel.panelPad}>
              {renderSection("Trang chủ · 4 ảnh chủ đề (\"Chọn theo điều tóc cần\")", concernSlots)}
            </div>
          </div>

          <div className={panel.panel} style={{ marginBottom: 16 }}>
            <div className={panel.panelPad}>
              <b style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Nút liên hệ nổi</b>
              <span style={{ fontSize: 12, color: "var(--admin-muted, #667085)" }}>
                Hiện phía trên khung chat ở mọi trang. Để trống link nào thì nút đó tự ẩn.
              </span>
              <div className={panel.grid2} style={{ marginTop: 12 }}>
                {CONTACT_SLOTS.map(({ key, label, placeholder }) => (
                  <label key={key}>
                    {label}
                    <input
                      value={contactHrefs[key] ?? ""}
                      onChange={(event) =>
                        setContactHrefs((current) => ({ ...current, [key]: event.target.value }))
                      }
                      placeholder={placeholder}
                    />
                  </label>
                ))}
              </div>
              <button className={panel.saveButton} disabled={contactSaving} onClick={() => void saveContactButtons()} style={{ marginTop: 12 }}>
                {contactSaving ? "Đang lưu..." : (<><Save size={14} /> Lưu nút liên hệ</>)}
              </button>
            </div>
          </div>

          <div className={panel.panel}>
          <AdminTableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Tìm vị trí banner hoặc danh mục..."
            right={<strong>{filteredSlots.length} vị trí</strong>}
          />
          <div className={panel.panelPad}>
            {renderSection("Trang chủ · 3 banner cố định", filteredSlots)}
          </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
