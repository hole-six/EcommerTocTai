"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";
import drawer from "../coupons/coupons.module.css";

type Address = { recipientName: string; phone: string; province: string; district?: string; ward: string; addressLine: string; isDefault?: boolean };
type Registered = { id: string; fullName: string; phone: string; email?: string; isActive: boolean; addresses: Address[]; createdAt: string; orderCount: number; totalSpent: number; lastOrderAt: string | null };
type Guest = { phone: string; fullName: string; email?: string; orderCount: number; totalSpent: number; lastOrderAt: string };
type Tab = "registered" | "guests";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const dateFmt = (value: string | null) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");

export default function AdminCustomersPage() {
  const [registered, setRegistered] = useState<Registered[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("registered");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Registered | null>(null);
  const [draft, setDraft] = useState({ fullName: "", phone: "", email: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers").then((response) => response.json()).then((body) => {
      setRegistered(body.data?.registered ?? []);
      setGuests(body.data?.guests ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const keyword = search.trim().toLocaleLowerCase("vi-VN");
  const visibleRegistered = registered.filter((customer) => !keyword || [customer.fullName, customer.phone, customer.email].filter(Boolean).some((value) => value!.toLocaleLowerCase("vi-VN").includes(keyword)));
  const visibleGuests = guests.filter((customer) => !keyword || [customer.fullName, customer.phone, customer.email].filter(Boolean).some((value) => value!.toLocaleLowerCase("vi-VN").includes(keyword)));

  function openCustomer(customer: Registered) {
    setSelected(customer);
    setDraft({ fullName: customer.fullName, phone: customer.phone, email: customer.email ?? "", isActive: customer.isActive });
  }

  async function saveCustomer() {
    if (!selected) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/customers/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, email: draft.email || null }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Không thể cập nhật khách hàng");
      setRegistered((current) => current.map((customer) => customer.id === selected.id ? { ...customer, ...draft, email: draft.email || undefined } : customer));
      setSelected(null); setMessage("Đã cập nhật thông tin khách hàng.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể cập nhật khách hàng"); }
    finally { setSaving(false); }
  }

  return (
    <AdminShell breadcrumb="Khách hàng">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / KHÁCH HÀNG</p>
          <h1>Khách hàng</h1>
        </div>
      </div>

      <div className={panel.metrics}>
        <article><span>TÀI KHOẢN ĐÃ ĐĂNG KÝ</span><strong>{registered.length}</strong></article>
        <article><span>KHÁCH VÃNG LAI (THEO SĐT)</span><strong>{guests.length}</strong></article>
      </div>

      <div className={panel.tabs}>
        <button className={tab === "registered" ? panel.tabActive : ""} onClick={() => setTab("registered")}>Đã đăng ký</button>
        <button className={tab === "guests" ? panel.tabActive : ""} onClick={() => setTab("guests")}>Khách vãng lai</button>
      </div>
      <div className={panel.panelPad} style={{ paddingTop: 0 }}>
        <label style={{ maxWidth: 440 }}><span style={{ display: "flex", gap: 7, alignItems: "center" }}><Search size={15} /> Tìm khách hàng</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, số điện thoại hoặc email..." /></label>
      </div>

      {tab === "registered" && (
        <div className={panel.panel}>
          <div className={panel.tableWrap}>
            <table>
            <thead><tr><th>Tên</th><th>SĐT</th><th>Email</th><th>Trạng thái</th><th>Ngày tham gia</th><th>Số đơn</th><th>Tổng chi tiêu</th><th>Đơn gần nhất</th><th></th></tr></thead>
            <tbody>
                {visibleRegistered.map((customer) => (
                  <tr key={customer.id}>
                    <td><b>{customer.fullName}</b></td>
                    <td>{customer.phone}</td>
                    <td>{customer.email ?? "—"}</td>
                    <td><span className={`${panel.status} ${customer.isActive ? panel.green : panel.gray}`}>{customer.isActive ? "Hoạt động" : "Tạm ngưng"}</span></td>
                    <td>{dateFmt(customer.createdAt)}</td>
                    <td>{customer.orderCount}</td>
                    <td><b>{money.format(customer.totalSpent)}</b></td>
                    <td>{dateFmt(customer.lastOrderAt)}</td>
                    <td><button className={panel.ghostButton} onClick={() => openCustomer(customer)}>Xem / Sửa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && visibleRegistered.length === 0 && <p className={panel.empty}>Không có khách hàng phù hợp.</p>}
            {loading && <p className={panel.empty}>Đang tải…</p>}
          </div>
        </div>
      )}

      {tab === "guests" && (
        <div className={panel.panel}>
          <div className={panel.tableWrap}>
            <table>
              <thead><tr><th>Tên</th><th>SĐT</th><th>Email</th><th>Số đơn</th><th>Tổng chi tiêu</th><th>Đơn gần nhất</th></tr></thead>
              <tbody>
                {visibleGuests.map((customer) => (
                  <tr key={customer.phone}>
                    <td><b>{customer.fullName}</b></td>
                    <td>{customer.phone}</td>
                    <td>{customer.email ?? "—"}</td>
                    <td>{customer.orderCount}</td>
                    <td><b>{money.format(customer.totalSpent)}</b></td>
                    <td>{dateFmt(customer.lastOrderAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && visibleGuests.length === 0 && <p className={panel.empty}>Không có khách hàng phù hợp.</p>}
            {loading && <p className={panel.empty}>Đang tải…</p>}
          </div>
        </div>
      )}
      <p className={panel.message}>Khách vãng lai là người đặt hàng chỉ bằng số điện thoại, không tạo tài khoản — đơn của họ cần admin xác nhận thủ công ở trang Đơn hàng.</p>
      {message && <p className={panel.message}>{message}</p>}
      <aside className={`${drawer.drawer} ${selected ? drawer.open : ""}`} aria-hidden={!selected}>
        <div className={drawer.drawerBody}>{selected && <><header className={drawer.drawerHeader}><div><span>CUSTOMER PROFILE</span><h2>{selected.fullName}</h2><p>{selected.orderCount} đơn · {money.format(selected.totalSpent)}</p></div><button onClick={() => setSelected(null)} aria-label="Đóng"><X size={19} /></button></header><div className={drawer.formGrid}><label>Họ và tên<input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} /></label><label>Số điện thoại<input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} /></label><label>Email<input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="Không bắt buộc" /></label><label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} style={{ width: "auto" }} /> Cho phép tài khoản đăng nhập</label></div><section style={{ marginTop: 28 }}><b>Địa chỉ đã lưu ({selected.addresses.length})</b>{selected.addresses.length === 0 ? <p style={{ color: "#667085", fontSize: 12 }}>Khách hàng chưa lưu địa chỉ nào.</p> : selected.addresses.map((address, index) => <p key={`${address.phone}-${index}`} style={{ padding: "11px 0", margin: 0, borderBottom: "1px solid #eaecf0", fontSize: 12 }}>{address.isDefault && <b>Địa chỉ mặc định · </b>}{[address.recipientName, address.phone, address.addressLine, address.ward, address.district, address.province].filter(Boolean).join(" · ")}</p>)}</section></>}</div>
        <footer className={drawer.drawerFooter}><button className={drawer.cancelButton} onClick={() => setSelected(null)}>Đóng</button><button className={panel.saveButton} disabled={saving || !draft.fullName || !draft.phone} onClick={() => void saveCustomer()}>{saving ? "Đang lưu…" : "Lưu khách hàng"}</button></footer>
      </aside>
      {selected && <button className={drawer.backdrop} onClick={() => setSelected(null)} aria-label="Đóng thông tin khách hàng" />}
    </AdminShell>
  );
}
