"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import { SiteFooter } from "@/components/sites/manmatters-com-61d14dee/shared/SiteFooter";
import { providerLabel, statusLabel, trackingUrl, type OrderStatus, type ShippingProvider } from "@/lib/orderLabels";

type Address = { _id: string; recipientName: string; phone: string; province: string; district: string; ward: string; addressLine: string; isDefault?: boolean };
type Profile = { fullName: string; email?: string; phone: string; addresses: Address[] };
type Order = { _id: string; orderNumber: string; total: number; status: OrderStatus; trackingNumber?: string; shippingProvider?: ShippingProvider; createdAt: string; items: { name: string; quantity: number }[] };
type AddressForm = { recipientName: string; phone: string; province: string; district: string; ward: string; addressLine: string };
type Tab = "orders" | "addresses" | "profile";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const emptyAddress: AddressForm = { recipientName: "", phone: "", province: "", district: "", ward: "", addressLine: "" };
const tabs: [Tab, string][] = [["orders", "Đơn hàng"], ["addresses", "Địa chỉ"], ["profile", "Thông tin cá nhân"]];
const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none";
const cardClass = "rounded-lg border border-neutral-200 bg-white p-4";

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "" });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [showPhoneChange, setShowPhoneChange] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ phone: "", currentPassword: "" });
  const [phoneSaving, setPhoneSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then(async (response) => {
        if (response.status === 401) { router.push("/login"); return; }
        const body = await response.json();
        setProfile(body.data);
        setProfileForm({ fullName: body.data.fullName, email: body.data.email ?? "" });
      })
      .finally(() => setLoading(false));
    fetch("/api/orders/me").then((response) => response.json()).then((body) => setOrders(body.data ?? []));
  }, [router]);

  function addressField<K extends keyof AddressForm>(key: K) {
    return { value: addressForm[key], onChange: (event: ChangeEvent<HTMLInputElement>) => setAddressForm((current) => ({ ...current, [key]: event.target.value })) };
  }

  async function saveProfile() {
    setMessage("");
    const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm) });
    const body = await response.json();
    setMessage(response.ok ? "Đã lưu thông tin cá nhân." : body.error);
    if (response.ok) setProfile(body.data);
  }

  async function savePhone() {
    setMessage("");
    setPhoneSaving(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phoneForm),
      });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error ?? "Đổi số điện thoại thất bại"); return; }
      setProfile(body.data);
      setShowPhoneChange(false);
      setPhoneForm({ phone: "", currentPassword: "" });
      setMessage("Đã đổi số điện thoại.");
    } finally {
      setPhoneSaving(false);
    }
  }

  async function addAddress() {
    setMessage("");
    const response = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addressForm) });
    const body = await response.json();
    if (response.ok) { setProfile(body.data); setAddressForm(emptyAddress); setShowAddAddress(false); setMessage("Đã thêm địa chỉ mới."); } else setMessage(body.error);
  }

  async function setDefaultAddress(addressId: string) {
    const response = await fetch(`/api/account/addresses/${addressId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
    const body = await response.json();
    if (response.ok) setProfile(body.data);
  }

  async function deleteAddress(addressId: string) {
    const response = await fetch(`/api/account/addresses/${addressId}`, { method: "DELETE" });
    const body = await response.json();
    if (response.ok) setProfile(body.data);
  }

  if (loading) return <div className="min-h-screen bg-white"><SiteHeader compact /><p className="p-10 text-center text-sm text-brand-muted">Đang tải…</p></div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader compact />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-2xl font-black tracking-tight text-brand-navy">Xin chào, {profile.fullName}</h1>
        <div className="mt-6 flex gap-2 border-b border-neutral-200">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`border-b-2 px-4 py-2 text-sm font-semibold ${tab === key ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-muted hover:text-brand-ink"}`}>{label}</button>
          ))}
        </div>

        {message && <p className="mt-4 text-sm text-brand-blue">{message}</p>}

        {tab === "orders" && (
          <div className="mt-6 space-y-3">
            {orders.length === 0 && <p className="text-sm text-brand-muted">Bạn chưa có đơn hàng nào.</p>}
            {orders.map((order) => (
              <div key={order._id} className={cardClass}>
                <div className="flex items-center justify-between">
                  <b className="text-brand-navy">{order.orderNumber}</b>
                  <span className="text-xs font-semibold text-brand-muted">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <p className="mt-1 text-sm text-brand-muted">{order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded-md bg-brand-bg px-2.5 py-1 text-xs font-bold text-brand-navy">{statusLabel[order.status]}</span>
                  <b className="text-brand-navy">{money.format(order.total)}</b>
                </div>
                {order.trackingNumber && (
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-brand-muted">
                    <span>
                      {order.shippingProvider && order.shippingProvider !== "manual" ? providerLabel[order.shippingProvider] : "Mã vận đơn"}
                    </span>
                    {trackingUrl(order.shippingProvider, order.trackingNumber) ? (
                      <a
                        href={trackingUrl(order.shippingProvider, order.trackingNumber)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                      >
                        Xem vận đơn <ExternalLink size={13} />
                      </a>
                    ) : (
                      <b className="text-brand-blue">{order.trackingNumber}</b>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "addresses" && (
          <div className="mt-6 space-y-3">
            {profile.addresses.map((address) => (
              <div key={address._id} className={`${cardClass} text-sm`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b className="text-brand-ink">{address.recipientName}</b> · {address.phone}
                    {address.isDefault && <span className="ml-2 rounded-md bg-brand-gold/30 px-2 py-0.5 text-[10px] font-bold text-brand-navy">Mặc định</span>}
                    <p className="mt-1 text-brand-muted">{address.addressLine}, {address.ward}, {address.district}, {address.province}</p>
                  </div>
                  <div className="flex shrink-0 gap-3 text-xs">
                    {!address.isDefault && <button onClick={() => setDefaultAddress(address._id)} className="text-brand-link hover:underline">Đặt mặc định</button>}
                    <button onClick={() => deleteAddress(address._id)} className="text-brand-muted hover:text-red-600">Xóa</button>
                  </div>
                </div>
              </div>
            ))}
            {!showAddAddress && <button onClick={() => setShowAddAddress(true)} className="rounded-md border border-dashed border-neutral-300 px-4 py-2 text-sm text-brand-muted hover:border-brand-blue hover:text-brand-blue">+ Thêm địa chỉ mới</button>}
            {showAddAddress && (
              <div className={cardClass}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input placeholder="Người nhận" {...addressField("recipientName")} className={inputClass} />
                  <input placeholder="Số điện thoại" {...addressField("phone")} className={inputClass} />
                  <input placeholder="Tỉnh / Thành phố" {...addressField("province")} className={inputClass} />
                  <input placeholder="Quận / Huyện" {...addressField("district")} className={inputClass} />
                  <input placeholder="Phường / Xã" {...addressField("ward")} className={inputClass} />
                  <input placeholder="Địa chỉ cụ thể" {...addressField("addressLine")} className={inputClass} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={addAddress} className="rounded-md bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue">Lưu địa chỉ</button>
                  <button onClick={() => { setShowAddAddress(false); setAddressForm(emptyAddress); }} className="rounded-md px-4 py-2 text-sm text-brand-muted hover:text-brand-ink">Hủy</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="mt-6 max-w-sm space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-brand-muted">Họ và tên</span>
              <input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-brand-muted">Email</span>
              <input value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-brand-muted">Số điện thoại</span>
              <input value={profile.phone} disabled className={`${inputClass} bg-neutral-100 text-brand-muted`} />
            </label>
            <button onClick={saveProfile} className="rounded-md bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue">Lưu thay đổi</button>

            <div className="mt-6 border-t border-neutral-200 pt-4">
              {!showPhoneChange && (
                <button
                  onClick={() => { setShowPhoneChange(true); setPhoneForm({ phone: profile.phone, currentPassword: "" }); }}
                  className="text-sm font-semibold text-brand-link hover:underline"
                >
                  Đổi số điện thoại
                </button>
              )}
              {showPhoneChange && (
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-brand-muted">Số điện thoại mới</span>
                    <input
                      value={phoneForm.phone}
                      onChange={(event) => setPhoneForm((current) => ({ ...current, phone: event.target.value }))}
                      className={inputClass}
                      placeholder="Ví dụ: 0901 234 567"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-brand-muted">Mật khẩu hiện tại (để xác nhận)</span>
                    <input
                      type="password"
                      value={phoneForm.currentPassword}
                      onChange={(event) => setPhoneForm((current) => ({ ...current, currentPassword: event.target.value }))}
                      className={inputClass}
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={savePhone}
                      disabled={phoneSaving || !phoneForm.phone || !phoneForm.currentPassword}
                      className="rounded-md bg-brand-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue disabled:opacity-50"
                    >
                      {phoneSaving ? "Đang lưu..." : "Xác nhận đổi"}
                    </button>
                    <button
                      onClick={() => { setShowPhoneChange(false); setPhoneForm({ phone: "", currentPassword: "" }); }}
                      className="rounded-md px-4 py-2 text-sm text-brand-muted hover:text-brand-ink"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
