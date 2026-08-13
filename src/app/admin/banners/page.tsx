"use client";

import { Check, Film, ImagePlus, Megaphone, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableToolbar } from "@/components/admin/AdminTableTools";
import { UploadField } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";

const SITE_BAR_SLOT_KEY = "site-announcement-bar";
const MEN_VIDEO_SLOT_PREFIX = "men-video-";
const DEFAULT_MEN_VIDEOS = [
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8e4e7b5ab468e85ba/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8a151fd521855d7fa/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8a151fd521855d7f5/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a5f1dd8eda64ba028b64bc9/main.mp4",
];

type Banner = {
  _id: string;
  pageKey: string;
  slotKey: string;
  placement: "home_hero" | "home_promo" | "all_products" | "category" | "site_bar" | "home_men_videos";
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
function normalize(value: string) {
  return value.toLocaleLowerCase("vi-VN");
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [barText, setBarText] = useState("");
  const [barCtaLabel, setBarCtaLabel] = useState("");
  const [barCtaHref, setBarCtaHref] = useState("");
  const [barSaving, setBarSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

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
    setLoading(false);
  }

  useEffect(() => {
    void load();
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

  function menVideoBanner(index: number) {
    return banners.find((banner) => banner.slotKey === `${MEN_VIDEO_SLOT_PREFIX}${index + 1}`);
  }

  async function uploadMenVideo(index: number, file: File) {
    setVideoUploading(index);
    setMessage("");
    try {
      const current = menVideoBanner(index);
      const previousUrl = current?.videoUrl ?? "";
      const form = new FormData();
      form.append("file", file);
      form.append("previousUrl", previousUrl);
      const uploadResponse = await fetch("/api/admin/uploads/video", { method: "POST", body: form });
      const uploadBody = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadBody.error ?? "Upload video thất bại");
      const payload = {
        pageKey: "home",
        slotKey: `${MEN_VIDEO_SLOT_PREFIX}${index + 1}`,
        placement: "home_men_videos" as const,
        mediaType: "video" as const,
        videoUrl: uploadBody.data.url,
        alt: `Video Đàn ông đích thực ${index + 1}`,
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

  const slots = useMemo(() => [...homeSlots], []);

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
      ctaHref: current?.ctaHref || slot.defaultHref,
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
                  const banner = menVideoBanner(index);
                  const videoUrl = banner?.videoUrl || DEFAULT_MEN_VIDEOS[index];
                  const isCustom = Boolean(banner?.videoUrl);
                  return (
                    <div key={index} style={{ border: "1px solid var(--admin-border, #eaecf0)", borderRadius: 12, padding: 10 }}>
                      <video src={videoUrl} controls muted style={{ width: "100%", aspectRatio: "9/16", borderRadius: 8, background: "#000", objectFit: "cover" }} />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <b style={{ fontSize: 12.5 }}>Video {index + 1}</b>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: isCustom ? "#12805c" : "var(--admin-faint, #98a2b3)" }}>
                          {isCustom ? "Đã tuỳ chỉnh" : "Mặc định"}
                        </span>
                      </div>
                      <input
                        ref={(element) => { fileInputs.current[index] = element; }}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        style={{ display: "none" }}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadMenVideo(index, file);
                          event.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className={panel.secondaryButton}
                        disabled={videoUploading === index}
                        onClick={() => fileInputs.current[index]?.click()}
                        style={{ width: "100%", marginTop: 8 }}
                      >
                        {videoUploading === index ? "Đang tải lên..." : (<><Upload size={13} /> Thay video</>)}
                      </button>
                    </div>
                  );
                })}
              </div>
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
