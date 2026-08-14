"use client";

import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminPagination,
  AdminTableToolbar,
} from "@/components/admin/AdminTableTools";
import panel from "@/components/admin/admin-panel.module.css";
import { showToast } from "@/components/ui/Toast";
import { extractApiError } from "@/lib/client/errors";
import styles from "./coupons.module.css";

type Coupon = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
};

type Form = {
  code: string;
  type: "percent" | "fixed";
  value: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: Form = {
  code: "",
  type: "percent",
  value: "",
  minOrderValue: "0",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};
const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const PAGE_SIZE = 10;

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  function load() {
    setLoading(true);
    fetch("/api/admin/coupons?page=1&limit=300")
      .then((response) => response.json())
      .then((body) => setCoupons(body.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi-VN");
    return coupons.filter((coupon) => {
      const matchesSearch =
        !term ||
        [coupon.code, coupon.type]
          .join(" ")
          .toLocaleLowerCase("vi-VN")
          .includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && coupon.isActive) ||
        (statusFilter === "inactive" && !coupon.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrderValue: String(coupon.minOrderValue),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      isActive: coupon.isActive,
    });
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
      const response = await fetch(
        editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(extractApiError(body, "Lưu mã giảm giá thất bại"));
      const successMessage = editingId
        ? "Đã cập nhật mã giảm giá."
        : "Đã tạo mã giảm giá mới.";
      setMessage(successMessage);
      showToast(successMessage, "success");
      resetForm();
      load();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lưu mã giảm giá thất bại";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa mã giảm giá này?")) return;
    const response = await fetch(`/api/admin/coupons/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setMessage("Đã xóa mã giảm giá.");
      showToast("Đã xóa mã giảm giá.", "success");
      setCoupons((current) => current.filter((coupon) => coupon._id !== id));
    } else {
      showToast("Không thể xóa mã giảm giá.", "error");
    }
  }

  return (
    <AdminShell breadcrumb="Mã giảm giá">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / MÃ GIẢM GIÁ</p>
          <h1>Mã giảm giá</h1>
        </div>
        <button className={panel.primaryButton} onClick={openCreate}>
          <Plus size={15} /> Tạo mã giảm giá
        </button>
      </div>

      <div className={panel.panel}>
        <AdminTableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Tìm mã giảm giá..."
          filters={
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Đã tắt</option>
            </select>
          }
          right={<strong>{filtered.length} mã</strong>}
        />
        <div className={panel.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th className={panel.rightCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((coupon) => (
                <tr key={coupon._id}>
                  <td data-label="Mã">
                    <b>{coupon.code}</b>
                  </td>
                  <td data-label="Loại">{coupon.type === "percent" ? "Phần trăm" : "Cố định"}</td>
                  <td data-label="Giá trị">
                    {coupon.type === "percent"
                      ? `${coupon.value}%${
                          coupon.maxDiscount
                            ? `, tối đa ${money.format(coupon.maxDiscount)}`
                            : ""
                        }`
                      : money.format(coupon.value)}
                  </td>
                  <td data-label="Đơn tối thiểu">
                    {coupon.minOrderValue
                      ? money.format(coupon.minOrderValue)
                      : "-"}
                  </td>
                  <td data-label="Đã dùng">
                    {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </td>
                  <td data-label="Hết hạn">
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString("vi-VN")
                      : "Không giới hạn"}
                  </td>
                  <td data-label="Trạng thái">
                    <span
                      className={`${panel.status} ${
                        coupon.isActive ? panel.green : panel.gray
                      }`}
                    >
                      {coupon.isActive ? "Hoạt động" : "Đã tắt"}
                    </span>
                  </td>
                  <td data-full="true">
                    <div className={panel.tableActions}>
                      <button
                        className={`${panel.iconButton} ${panel.editButton}`}
                        onClick={() => edit(coupon)}
                      >
                        <Edit3 size={14} /> Sửa
                      </button>
                      <button
                        className={`${panel.iconButton} ${panel.dangerIconButton}`}
                        onClick={() => void remove(coupon._id)}
                        aria-label="Xóa mã giảm giá"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && (
            <p className={panel.empty}>Không có mã giảm giá phù hợp.</p>
          )}
          {loading && <p className={panel.empty}>Đang tải...</p>}
        </div>
        {!loading && filtered.length > 0 && (
          <AdminPagination
            page={page}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      <aside
        className={`${styles.drawer} ${drawerOpen ? styles.open : ""}`}
        aria-hidden={!drawerOpen}
      >
        <div className={styles.drawerBody}>
          <header className={styles.drawerHeader}>
            <div>
              <span>{editingId ? "SỬA MÃ" : "MÃ MỚI"}</span>
              <h2>{editingId ? "Sửa mã giảm giá" : "Tạo mã giảm giá"}</h2>
              <p>Thiết lập ưu đãi và điều kiện áp dụng.</p>
            </div>
            <button onClick={resetForm} aria-label="Đóng form">
              <X size={19} />
            </button>
          </header>
          <div className={styles.formGrid}>
            <label>
              Mã giảm giá
              <input
                type="text"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="SALE10"
              />
            </label>
            <label>
              Loại
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as Form["type"],
                  }))
                }
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </label>
            <label>
              Giá trị {form.type === "percent" ? "(%)" : "(đ)"}
              <input
                type="number"
                value={form.value}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Đơn tối thiểu (đ)
              <input
                type="number"
                value={form.minOrderValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minOrderValue: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Giảm tối đa (đ)
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxDiscount: event.target.value,
                  }))
                }
                placeholder="Chỉ áp dụng loại %"
              />
            </label>
            <label>
              Giới hạn lượt dùng
              <input
                type="number"
                value={form.usageLimit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    usageLimit: event.target.value,
                  }))
                }
                placeholder="Không giới hạn"
              />
            </label>
            <label>
              Ngày hết hạn
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt: event.target.value,
                  }))
                }
              />
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Đang áp dụng
            </label>
          </div>
        </div>
        <footer className={styles.drawerFooter}>
          <button className={styles.cancelButton} onClick={resetForm}>
            Đóng
          </button>
          <button
            className={panel.saveButton}
            disabled={saving || !form.code || !form.value}
            onClick={() => void submit()}
          >
            {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mã"}
          </button>
        </footer>
      </aside>
      {drawerOpen && (
        <button
          className={styles.backdrop}
          onClick={resetForm}
          aria-label="Đóng form mã giảm giá"
        />
      )}
      {message && <p className={panel.message}>{message}</p>}
    </AdminShell>
  );
}
