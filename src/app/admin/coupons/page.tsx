"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "./coupons.module.css";

type Coupon = { _id: string; code: string; type: "percent" | "fixed"; value: number; minOrderValue: number; maxDiscount?: number | null; usageLimit?: number | null; usedCount: number; expiresAt?: string | null; isActive: boolean };
type Form = { code: string; type: "percent" | "fixed"; value: string; minOrderValue: string; maxDiscount: string; usageLimit: string; expiresAt: string; isActive: boolean };

const emptyForm: Form = { code: "", type: "percent", value: "", minOrderValue: "0", maxDiscount: "", usageLimit: "", expiresAt: "", isActive: true };
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    fetch("/api/admin/coupons").then((response) => response.json()).then((body) => setCoupons(body.data ?? [])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setDrawerOpen(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setDrawerOpen(true);
  }

  function edit(coupon: Coupon) {
    setForm({ code: coupon.code, type: coupon.type, value: String(coupon.value), minOrderValue: String(coupon.minOrderValue), maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "", usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "", expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "", isActive: coupon.isActive });
    setEditingId(coupon._id);
    setDrawerOpen(true);
  }

  async function submit() {
    setMessage("");
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderValue: Number(form.minOrderValue || 0),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
        isActive: form.isActive,
      };
      const response = await fetch(editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Lưu mã giảm giá thất bại");
      setMessage(editingId ? "Đã cập nhật mã giảm giá." : "Đã tạo mã giảm giá mới.");
      resetForm();
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu mã giảm giá thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa mã giảm giá này?")) return;
    const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (response.ok) { setMessage("Đã xóa mã giảm giá."); load(); }
  }

  return (
    <AdminShell breadcrumb="Mã giảm giá">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / MÃ GIẢM GIÁ</p>
          <h1>Mã giảm giá</h1>
        </div>
        <button className={panel.primaryButton} onClick={openCreate}><Plus size={15} /> Tạo mã giảm giá</button>
      </div>

      <div className={panel.panel}>
        <div className={panel.tableWrap}>
          <table>
            <thead><tr><th>Mã</th><th>Loại</th><th>Giá trị</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Hết hạn</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td><b>{coupon.code}</b></td>
                  <td>{coupon.type === "percent" ? "Phần trăm" : "Số tiền cố định"}</td>
                  <td>{coupon.type === "percent" ? `${coupon.value}%${coupon.maxDiscount ? ` (tối đa ${money.format(coupon.maxDiscount)})` : ""}` : money.format(coupon.value)}</td>
                  <td>{coupon.minOrderValue ? money.format(coupon.minOrderValue) : "—"}</td>
                  <td>{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</td>
                  <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</td>
                  <td><span className={`${panel.status} ${coupon.isActive ? panel.green : panel.gray}`}>{coupon.isActive ? "Hoạt động" : "Tắt"}</span></td>
                  <td className={panel.actions}>
                    <button className={panel.ghostButton} onClick={() => edit(coupon)}>Sửa</button>
                    <button className={panel.dangerButton} onClick={() => remove(coupon._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && coupons.length === 0 && <p className={panel.empty}>Chưa có mã giảm giá nào.</p>}
          {loading && <p className={panel.empty}>Đang tải…</p>}
        </div>
      </div>

      <aside className={`${styles.drawer} ${drawerOpen ? styles.open : ""}`} aria-hidden={!drawerOpen}>
        <div className={styles.drawerBody}>
          <header className={styles.drawerHeader}><div><span>{editingId ? "EDIT COUPON" : "NEW COUPON"}</span><h2>{editingId ? "Sửa mã giảm giá" : "Tạo mã giảm giá"}</h2><p>Thiết lập ưu đãi và điều kiện áp dụng.</p></div><button onClick={resetForm} aria-label="Đóng form"><X size={19} /></button></header>
          <div className={styles.formGrid}>
            <label>Mã giảm giá
              <input type="text" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="SALE10" />
            </label>
            <label>Loại
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as Form["type"] }))}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </label>
            <label>Giá trị {form.type === "percent" ? "(%)" : "(đ)"}
              <input type="number" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} />
            </label>
            <label>Đơn tối thiểu (đ)
              <input type="number" value={form.minOrderValue} onChange={(event) => setForm((current) => ({ ...current, minOrderValue: event.target.value }))} />
            </label>
            <label>Giảm tối đa (đ, chỉ áp dụng loại %)
              <input type="number" value={form.maxDiscount} onChange={(event) => setForm((current) => ({ ...current, maxDiscount: event.target.value }))} />
            </label>
            <label>Giới hạn lượt dùng
              <input type="number" value={form.usageLimit} onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))} placeholder="Không giới hạn" />
            </label>
            <label>Ngày hết hạn
              <input type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
            </label>
            <label style={{ flexDirection: "row", alignItems: "center", display: "flex", gap: 8 }}>
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} style={{ width: "auto" }} />
              Đang áp dụng
            </label>
          </div>
        </div>
        <footer className={styles.drawerFooter}><button className={styles.cancelButton} onClick={resetForm}>Đóng</button><button className={panel.saveButton} disabled={saving || !form.code || !form.value} onClick={submit}>{saving ? "Đang lưu…" : editingId ? "Cập nhật" : "Tạo mã"}</button></footer>
      </aside>
      {drawerOpen && <button className={styles.backdrop} onClick={resetForm} aria-label="Đóng form mã giảm giá" />}
      {message && <p className={panel.message}>{message}</p>}
    </AdminShell>
  );
}
