"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPagination } from "@/components/admin/AdminTableTools";
import panel from "@/components/admin/admin-panel.module.css";
import drawer from "../coupons/coupons.module.css";
import styles from "./customers.module.css";

type Address = {
  recipientName: string;
  phone: string;
  province: string;
  district?: string;
  ward: string;
  addressLine: string;
  isDefault?: boolean;
};
type Registered = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  isActive: boolean;
  addresses: Address[];
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};
type Guest = {
  phone: string;
  fullName: string;
  email?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};
type Tab = "registered" | "guests";
type Sort = "recent" | "spend" | "orders" | "name";

type Metrics = { registeredTotal: number; guestsTotal: number; inactiveTotal: number; newThisMonthTotal: number };

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const dateFmt = (value: string | null) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
const emptyDraft = { fullName: "", phone: "", email: "", isActive: true };
const emptyMetrics: Metrics = { registeredTotal: 0, guestsTotal: 0, inactiveTotal: 0, newThisMonthTotal: 0 };
const PAGE_SIZE = 10;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KH";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <>—</>;
  return (
    <span className={styles.copyRow}>
      {value}
      <button
        type="button"
        className={styles.copyButton}
        aria-label="Sao chép"
        onClick={() => {
          void navigator.clipboard?.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </span>
  );
}

export default function AdminCustomersPage() {
  const [registered, setRegistered] = useState<Registered[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("registered");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);

  const [selected, setSelected] = useState<Registered | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [createPassword, setCreatePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [revealedPassword, setRevealedPassword] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, sort, statusFilter]);

  const load = useCallback((overrides?: { tab?: Tab; page?: number }) => {
    const effectiveTab = overrides?.tab ?? tab;
    const effectivePage = overrides?.page ?? page;
    setLoading(true);
    const params = new URLSearchParams({ tab: effectiveTab, page: String(effectivePage), limit: String(PAGE_SIZE) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (sort !== "recent") params.set("sort", sort);
    if (effectiveTab === "registered" && statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/customers?${params.toString()}`)
      .then((response) => response.json())
      .then((body) => {
        if (effectiveTab === "registered") setRegistered(body.data?.registered ?? []);
        else setGuests(body.data?.guests ?? []);
        setTotal(body.pagination?.total ?? 0);
        setPageCount(body.pagination?.pages ?? 1);
        setMetrics(body.metrics ?? emptyMetrics);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, page, sort, statusFilter, tab]);
  useEffect(() => { load(); }, [load]);

  const visibleRegistered = registered;
  const visibleGuests = guests;

  function openCustomer(customer: Registered) {
    setSelected(customer);
    setCreating(false);
    setDraft({ fullName: customer.fullName, phone: customer.phone, email: customer.email ?? "", isActive: customer.isActive });
    setMessage("");
    setRevealedPassword("");
    setResetOpen(false);
    setResetPassword("");
    setConfirmDelete(false);
    setDeleteError("");
  }

  function openCreate() {
    setSelected(null);
    setCreating(true);
    setDraft(emptyDraft);
    setCreatePassword("");
    setMessage("");
    setRevealedPassword("");
  }

  function closeDrawer() {
    setSelected(null);
    setCreating(false);
  }

  async function saveCustomer() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/customers/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, email: draft.email || null }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Không thể cập nhật khách hàng");
      setRegistered((current) =>
        current.map((customer) => (customer.id === selected.id ? { ...customer, ...draft, email: draft.email || undefined } : customer)),
      );
      setMessage("Đã cập nhật thông tin khách hàng.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể cập nhật khách hàng");
    } finally {
      setSaving(false);
    }
  }

  async function createCustomer() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, email: draft.email || undefined, password: createPassword || undefined }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Không thể tạo khách hàng");
      setTab("registered");
      setPage(1);
      load({ tab: "registered", page: 1 });
      if (body.generatedPassword) {
        setRevealedPassword(body.generatedPassword);
        setMessage("Đã tạo tài khoản khách hàng. Gửi mật khẩu tạm bên dưới cho khách để đăng nhập.");
      } else {
        setMessage("Đã tạo tài khoản khách hàng.");
        closeDrawer();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo khách hàng");
    } finally {
      setSaving(false);
    }
  }

  async function resetPasswordSubmit(auto: boolean) {
    if (!selected) return;
    const nextPassword = auto ? `${Math.random().toString(36).slice(-4)}${Math.floor(1000 + Math.random() * 9000)}` : resetPassword;
    if (!nextPassword || nextPassword.length < 8) {
      setMessage("Mật khẩu mới cần tối thiểu 8 ký tự.");
      return;
    }
    setResetting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/customers/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: nextPassword }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Không thể đặt lại mật khẩu");
      setRevealedPassword(nextPassword);
      setResetOpen(false);
      setResetPassword("");
      setMessage("Đã đặt lại mật khẩu. Gửi mật khẩu mới bên dưới cho khách hàng.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đặt lại mật khẩu");
    } finally {
      setResetting(false);
    }
  }

  async function deleteCustomer() {
    if (!selected) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/admin/customers/${selected.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Không thể xóa khách hàng");
      if (registered.length === 1 && page > 1) setPage((value) => value - 1);
      else load();
      closeDrawer();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Không thể xóa khách hàng");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(customer: Registered) {
    const nextActive = !customer.isActive;
    setRegistered((current) => current.map((row) => (row.id === customer.id ? { ...row, isActive: nextActive } : row)));
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setRegistered((current) => current.map((row) => (row.id === customer.id ? { ...row, isActive: !nextActive } : row)));
    }
  }

  const drawerOpen = Boolean(selected) || creating;

  return (
    <AdminShell breadcrumb="Khách hàng">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / KHÁCH HÀNG</p>
          <h1>Khách hàng</h1>
        </div>
        <button className={panel.primaryButton} onClick={openCreate}>
          <UserPlus size={15} /> Thêm khách hàng
        </button>
      </div>

      <div className={panel.metrics}>
        <article>
          <span>TÀI KHOẢN ĐÃ ĐĂNG KÝ</span>
          <strong>{metrics.registeredTotal}</strong>
        </article>
        <article>
          <span>KHÁCH VÃNG LAI (THEO SĐT)</span>
          <strong>{metrics.guestsTotal}</strong>
        </article>
        <article>
          <span>MỚI THÁNG NÀY</span>
          <strong>{metrics.newThisMonthTotal}</strong>
        </article>
        <article>
          <span>TÀI KHOẢN TẠM NGƯNG</span>
          <strong>{metrics.inactiveTotal}</strong>
        </article>
      </div>

      <div className={panel.tabs}>
        <button className={tab === "registered" ? panel.tabActive : ""} onClick={() => setTab("registered")}>
          Đã đăng ký ({metrics.registeredTotal})
        </button>
        <button className={tab === "guests" ? panel.tabActive : ""} onClick={() => setTab("guests")}>
          Khách vãng lai ({metrics.guestsTotal})
        </button>
      </div>

      <div className={panel.panel}>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, số điện thoại hoặc email..." />
          </div>
          {tab === "registered" && (
            <select className={styles.sortSelect} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          )}
          <select className={styles.sortSelect} value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="recent">Mới nhất</option>
            <option value="spend">Chi tiêu cao nhất</option>
            <option value="orders">Nhiều đơn nhất</option>
            <option value="name">Tên A–Z</option>
          </select>
        </div>

        {tab === "registered" ? (
          <div className={panel.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                  <th>Số đơn</th>
                  <th>Tổng chi tiêu</th>
                  <th>Đơn gần nhất</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRegistered.map((customer) => (
                  <tr key={customer.id}>
                    <td data-label="Khách hàng">
                      <span className={styles.nameCell}>
                        <span className={styles.avatar}>{initials(customer.fullName)}</span>
                        <span>
                          <b>{customer.fullName}</b>
                          <small>
                            <CopyField value={customer.phone} />
                          </small>
                        </span>
                      </span>
                    </td>
                    <td data-label="Email">{customer.email ? <CopyField value={customer.email} /> : "—"}</td>
                    <td data-label="Trạng thái">
                      <button
                        type="button"
                        className={`${panel.status} ${customer.isActive ? panel.green : panel.gray}`}
                        style={{ border: 0, cursor: "pointer" }}
                        onClick={() => void toggleActive(customer)}
                        title="Bấm để chuyển trạng thái"
                      >
                        {customer.isActive ? "Hoạt động" : "Tạm ngưng"}
                      </button>
                    </td>
                    <td data-label="Ngày tham gia">{dateFmt(customer.createdAt)}</td>
                    <td data-label="Số đơn">{customer.orderCount}</td>
                    <td data-label="Tổng chi tiêu">
                      <b>{money.format(customer.totalSpent)}</b>
                    </td>
                    <td data-label="Đơn gần nhất">{dateFmt(customer.lastOrderAt)}</td>
                    <td data-full="true">
                      <div className={styles.rowActions}>
                        <a
                          className={styles.iconLink}
                          href={`/admin/orders?q=${encodeURIComponent(customer.phone)}`}
                          title="Xem đơn hàng"
                        >
                          <ShoppingBag size={14} />
                        </a>
                        <button className={panel.ghostButton} onClick={() => openCustomer(customer)}>
                          Xem / Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && visibleRegistered.length === 0 && <p className={panel.empty}>Không có khách hàng phù hợp.</p>}
            {loading && <p className={panel.empty}>Đang tải…</p>}
          </div>
        ) : (
          <div className={panel.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>SĐT</th>
                  <th>Email</th>
                  <th>Số đơn</th>
                  <th>Tổng chi tiêu</th>
                  <th>Đơn gần nhất</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleGuests.map((customer) => (
                  <tr key={customer.phone}>
                    <td data-label="Tên">
                      <span className={styles.nameCell}>
                        <span className={styles.avatar}>{initials(customer.fullName)}</span>
                        <b>{customer.fullName}</b>
                      </span>
                    </td>
                    <td data-label="SĐT">
                      <CopyField value={customer.phone} />
                    </td>
                    <td data-label="Email">{customer.email ?? "—"}</td>
                    <td data-label="Số đơn">{customer.orderCount}</td>
                    <td data-label="Tổng chi tiêu">
                      <b>{money.format(customer.totalSpent)}</b>
                    </td>
                    <td data-label="Đơn gần nhất">{dateFmt(customer.lastOrderAt)}</td>
                    <td data-full="true">
                      <a className={styles.iconLink} href={`/admin/orders?q=${encodeURIComponent(customer.phone)}`} title="Xem đơn hàng">
                        <ShoppingBag size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && visibleGuests.length === 0 && <p className={panel.empty}>Không có khách hàng phù hợp.</p>}
            {loading && <p className={panel.empty}>Đang tải…</p>}
          </div>
        )}
        {!loading && ((tab === "registered" ? visibleRegistered : visibleGuests).length > 0) && (
          <AdminPagination page={page} pageCount={pageCount} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      <p className={panel.message}>
        Khách vãng lai là người đặt hàng chỉ bằng số điện thoại, không tạo tài khoản — đơn của họ cần admin xác nhận thủ công ở trang Đơn hàng.
      </p>

      <aside className={`${drawer.drawer} ${drawerOpen ? drawer.open : ""} ${styles.customerDrawer}`} aria-hidden={!drawerOpen}>
        <div className={drawer.drawerBody}>
          {creating && (
            <>
              <header className={drawer.drawerHeader}>
                <div>
                  <span>KHÁCH HÀNG MỚI</span>
                  <h2>Tạo tài khoản</h2>
                  <p>Dùng khi bạn cần tạo tài khoản thay cho khách (đặt hàng qua điện thoại, Zalo…)</p>
                </div>
                <button onClick={closeDrawer} aria-label="Đóng">
                  <X size={19} />
                </button>
              </header>
              <div className={drawer.formGrid}>
                <label>
                  Họ và tên
                  <input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} />
                </label>
                <label>
                  Số điện thoại
                  <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="0901234567" />
                </label>
                <label>
                  Email
                  <input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="Không bắt buộc" />
                </label>
                <label>
                  Mật khẩu ban đầu
                  <input
                    value={createPassword}
                    onChange={(event) => setCreatePassword(event.target.value)}
                    placeholder="Bỏ trống để hệ thống tự tạo"
                  />
                </label>
              </div>
              {revealedPassword && (
                <div className={styles.passwordReveal}>
                  <CheckCircle2 size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  Mật khẩu tạm cho tài khoản này: <code>{revealedPassword}</code>
                  <br />
                  Hãy gửi mật khẩu này cho khách và yêu cầu đổi lại sau khi đăng nhập.
                </div>
              )}
              {message && (
                <p className={panel.message} style={{ margin: "14px 0 0" }}>
                  {message}
                </p>
              )}
            </>
          )}

          {selected && (
            <>
              <header className={drawer.drawerHeader}>
                <div>
                  <span>HỒ SƠ KHÁCH HÀNG</span>
                  <h2>{selected.fullName}</h2>
                  <p>
                    {selected.orderCount} đơn · {money.format(selected.totalSpent)}
                  </p>
                </div>
                <button onClick={closeDrawer} aria-label="Đóng">
                  <X size={19} />
                </button>
              </header>

              <div className={styles.statRow}>
                <div>
                  <span>NGÀY THAM GIA</span>
                  <strong>{dateFmt(selected.createdAt)}</strong>
                </div>
                <div>
                  <span>ĐƠN GẦN NHẤT</span>
                  <strong>{dateFmt(selected.lastOrderAt)}</strong>
                </div>
                <div>
                  <span>ĐỊA CHỈ ĐÃ LƯU</span>
                  <strong>{selected.addresses.length}</strong>
                </div>
              </div>

              <div className={drawer.formGrid} style={{ marginTop: 18 }}>
                <label>
                  Họ và tên
                  <input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} />
                </label>
                <label>
                  Số điện thoại
                  <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <label>
                  Email
                  <input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="Không bắt buộc" />
                </label>
                <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
                    style={{ width: "auto" }}
                  />
                  Cho phép tài khoản đăng nhập
                </label>
              </div>

              <section className={styles.section}>
                <b>Địa chỉ đã lưu ({selected.addresses.length})</b>
                {selected.addresses.length === 0 ? (
                  <p className={styles.sectionHint}>Khách hàng chưa lưu địa chỉ nào.</p>
                ) : (
                  selected.addresses.map((address, index) => (
                    <p className={styles.addressCard} key={`${address.phone}-${index}`}>
                      {address.isDefault && <b>Địa chỉ mặc định · </b>}
                      {[address.recipientName, address.phone, address.addressLine, address.ward, address.district, address.province]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ))
                )}
              </section>

              <section className={styles.section}>
                <b>Truy cập &amp; bảo mật</b>
                <p className={styles.sectionHint}>Đặt lại mật khẩu khi khách quên hoặc yêu cầu hỗ trợ đăng nhập.</p>
                {!resetOpen ? (
                  <div className={styles.inlineActions}>
                    <button type="button" className={styles.linkButton} onClick={() => setResetOpen(true)}>
                      <KeyRound size={14} /> Đặt lại mật khẩu
                    </button>
                    <a className={styles.linkButton} href={`/admin/orders?q=${encodeURIComponent(selected.phone)}`}>
                      <ShoppingBag size={14} /> Xem đơn hàng
                    </a>
                  </div>
                ) : (
                  <div className={styles.confirmBox} style={{ borderColor: "#ffc7b2", background: "#fff3ef", color: "#7a1c0d" }}>
                    <input
                      placeholder="Mật khẩu mới (tối thiểu 8 ký tự), hoặc để trống để tạo tự động"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                    />
                    <div className={styles.inlineActions}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        disabled={resetting}
                        onClick={() => void resetPasswordSubmit(!resetPassword)}
                      >
                        {resetting ? "Đang xử lý…" : resetPassword ? "Đặt mật khẩu này" : "Tạo mật khẩu ngẫu nhiên"}
                      </button>
                      <button type="button" className={drawer.cancelButton} style={{ width: "auto", padding: "8px 12px" }} onClick={() => setResetOpen(false)}>
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
                {revealedPassword && (
                  <div className={styles.passwordReveal}>
                    <CheckCircle2 size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                    Mật khẩu mới: <code>{revealedPassword}</code>
                  </div>
                )}
              </section>

              <section className={styles.section}>
                <b>Vùng nguy hiểm</b>
                <p className={styles.sectionHint}>
                  {selected.orderCount > 0
                    ? "Khách hàng đã có đơn hàng nên không thể xóa — hãy tạm ngưng tài khoản ở trên nếu cần chặn đăng nhập."
                    : "Chỉ xóa được khi khách hàng chưa có đơn hàng nào."}
                </p>
                {!confirmDelete ? (
                  <button
                    type="button"
                    className={styles.dangerLinkButton}
                    disabled={selected.orderCount > 0}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} /> Xóa khách hàng
                  </button>
                ) : (
                  <div className={styles.confirmBox}>
                    <span>
                      <Ban size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                      Xóa tài khoản của <b>{selected.fullName}</b>? Hành động này không thể hoàn tác.
                    </span>
                    {deleteError && <span>{deleteError}</span>}
                    <div className={styles.inlineActions}>
                      <button type="button" className={styles.dangerLinkButton} disabled={deleting} onClick={() => void deleteCustomer()}>
                        {deleting ? "Đang xóa…" : "Xác nhận xóa"}
                      </button>
                      <button type="button" className={drawer.cancelButton} style={{ width: "auto", padding: "8px 12px" }} onClick={() => setConfirmDelete(false)}>
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {message && (
                <p className={panel.message} style={{ marginTop: 18 }}>
                  {message}
                </p>
              )}
            </>
          )}
        </div>
        <footer className={drawer.drawerFooter}>
          <button className={drawer.cancelButton} onClick={closeDrawer}>
            Đóng
          </button>
          {creating ? (
            <button className={panel.saveButton} disabled={saving || !draft.fullName || !draft.phone} onClick={() => void createCustomer()}>
              {saving ? "Đang tạo…" : (
                <>
                  <Plus size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Tạo khách hàng
                </>
              )}
            </button>
          ) : (
            <button className={panel.saveButton} disabled={saving || !draft.fullName || !draft.phone} onClick={() => void saveCustomer()}>
              {saving ? "Đang lưu…" : "Lưu khách hàng"}
            </button>
          )}
        </footer>
      </aside>
      {drawerOpen && <button className={drawer.backdrop} onClick={closeDrawer} aria-label="Đóng thông tin khách hàng" />}
    </AdminShell>
  );
}
