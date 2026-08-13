"use client";

import { Check, ImagePlus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableToolbar } from "@/components/admin/AdminTableTools";
import { UploadField } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";

type Banner = {
  _id: string;
  pageKey: string;
  slotKey: string;
  placement: "home_hero" | "home_promo" | "all_products" | "category";
  categorySlug: string;
  image: string;
  mobileImage: string;
  alt: string;
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

  async function load() {
    setLoading(true);
    const bannerResponse = await fetch("/api/banners?placement=all&all=true");
    const bannerBody = await bannerResponse.json();
    setBanners(bannerBody.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

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
      )}
    </AdminShell>
  );
}
