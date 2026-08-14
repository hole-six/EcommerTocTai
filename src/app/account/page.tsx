"use client";

import {
  BadgeCheck,
  Box,
  ChevronRight,
  CircleUserRound,
  Clock3,
  CreditCard,
  ExternalLink,
  Home,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import { SiteFooter } from "@/components/sites/manmatters-com-61d14dee/shared/SiteFooter";
import {
  paymentLabel,
  providerLabel,
  statusLabel,
  trackingUrl,
  type OrderStatus,
  type PaymentStatus,
  type ShippingProvider,
} from "@/lib/orderLabels";
import { extractApiError } from "@/lib/client/errors";
import styles from "./account.module.css";

type Address = {
  _id: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  isDefault?: boolean;
};
type Profile = {
  fullName: string;
  email?: string;
  phone: string;
  addresses: Address[];
};
type OrderItem = {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  image?: string;
  variantTitle?: string;
};
type Order = {
  _id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  trackingNumber?: string;
  shippingProvider?: ShippingProvider;
  createdAt: string;
  items: OrderItem[];
};
type AddressForm = {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
};
type Tab = "orders" | "addresses" | "profile";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const emptyAddress: AddressForm = {
  recipientName: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  addressLine: "",
};
const tabItems = [
  { key: "orders" as const, label: "Đơn hàng của tôi", icon: Box },
  { key: "addresses" as const, label: "Sổ địa chỉ", icon: MapPin },
  { key: "profile" as const, label: "Thông tin cá nhân", icon: UserRound },
];
const progressSteps: { status: OrderStatus; label: string; icon: typeof Clock3 }[] = [
  { status: "pending", label: "Đã đặt", icon: Clock3 },
  { status: "confirmed", label: "Xác nhận", icon: BadgeCheck },
  { status: "processing", label: "Đóng gói", icon: PackageCheck },
  { status: "shipping", label: "Đang giao", icon: Truck },
  { status: "completed", label: "Hoàn tất", icon: ShieldCheck },
];
const progressIndex: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipping: 3,
  completed: 4,
  cancelled: 0,
  returned: 4,
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState("");
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "" });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [showPhoneChange, setShowPhoneChange] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ phone: "", currentPassword: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/account", { cache: "no-store" }),
      fetch("/api/orders/me", { cache: "no-store" }),
    ])
      .then(async ([accountResponse, ordersResponse]) => {
        if (accountResponse.status === 401) {
          router.push("/login");
          return;
        }
        const [accountBody, ordersBody] = await Promise.all([
          accountResponse.json(),
          ordersResponse.json(),
        ]);
        setProfile(accountBody.data);
        setProfileForm({
          fullName: accountBody.data?.fullName ?? "",
          email: accountBody.data?.email ?? "",
        });
        setOrders(ordersBody.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => !["completed", "cancelled", "returned"].includes(order.status),
      ).length,
    [orders],
  );

  function addressField<K extends keyof AddressForm>(key: K) {
    return {
      value: addressForm[key],
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        setAddressForm((current) => ({ ...current, [key]: event.target.value })),
    };
  }

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  }

  function editAddress(address: Address) {
    setEditingAddressId(address._id);
    setAddressForm({
      recipientName: address.recipientName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      addressLine: address.addressLine,
    });
    setShowAddressForm(true);
  }

  async function saveProfile() {
    setMessage("");
    setSaving("profile");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(extractApiError(body, "Lưu thông tin cá nhân thất bại."));
        return;
      }
      setProfile(body.data);
      setMessage("Đã cập nhật thông tin cá nhân.");
    } finally {
      setSaving("");
    }
  }

  async function savePhone() {
    setMessage("");
    setSaving("phone");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phoneForm),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(extractApiError(body, "Đổi số điện thoại thất bại."));
        return;
      }
      setProfile(body.data);
      setShowPhoneChange(false);
      setPhoneForm({ phone: "", currentPassword: "" });
      setMessage("Đã đổi số điện thoại đăng nhập.");
    } finally {
      setSaving("");
    }
  }

  async function saveAddress() {
    setMessage("");
    setSaving("address");
    try {
      const response = await fetch(
        editingAddressId
          ? `/api/account/addresses/${editingAddressId}`
          : "/api/account/addresses",
        {
          method: editingAddressId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setMessage(
          extractApiError(
            body,
            editingAddressId ? "Cập nhật địa chỉ thất bại." : "Thêm địa chỉ thất bại.",
          ),
        );
        return;
      }
      setProfile(body.data);
      setMessage(editingAddressId ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ mới.");
      closeAddressForm();
    } finally {
      setSaving("");
    }
  }

  async function setDefaultAddress(addressId: string) {
    setMessage("");
    setSaving(addressId);
    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const body = await response.json();
      if (response.ok) {
        setProfile(body.data);
        setMessage("Đã đặt làm địa chỉ mặc định.");
      } else {
        setMessage(extractApiError(body, "Đặt địa chỉ mặc định thất bại."));
      }
    } finally {
      setSaving("");
    }
  }

  async function deleteAddress(addressId: string) {
    if (!window.confirm("Xóa địa chỉ này khỏi sổ địa chỉ?")) return;
    setMessage("");
    setSaving(addressId);
    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (response.ok) {
        setProfile(body.data);
        setMessage("Đã xóa địa chỉ.");
      } else {
        setMessage(extractApiError(body, "Xóa địa chỉ thất bại."));
      }
    } finally {
      setSaving("");
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <SiteHeader compact />
        <div className={styles.loading}>
          <span />
          <p>Đang chuẩn bị tài khoản của bạn…</p>
        </div>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className={styles.page}>
      <SiteHeader compact />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.avatar}>{initials(profile.fullName)}</div>
          <div className={styles.heroCopy}>
            <span>TÀI KHOẢN CAREWISE</span>
            <h1>Xin chào, {profile.fullName}</h1>
            <p>Quản lý đơn hàng, địa chỉ giao nhận và thông tin bảo mật tại một nơi.</p>
          </div>
          <div className={styles.quickStats}>
            <div><Box size={19} /><strong>{orders.length}</strong><span>Tổng đơn</span></div>
            <div><Truck size={19} /><strong>{activeOrders}</strong><span>Đang xử lý</span></div>
            <div><MapPin size={19} /><strong>{profile.addresses.length}</strong><span>Địa chỉ</span></div>
          </div>
        </section>

        <div className={styles.dashboard}>
          <aside className={styles.sidebar}>
            <nav aria-label="Quản lý tài khoản">
              {tabItems.map((item) => {
                const Icon = item.icon;
                const count =
                  item.key === "orders"
                    ? orders.length
                    : item.key === "addresses"
                      ? profile.addresses.length
                      : undefined;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={tab === item.key ? styles.activeTab : ""}
                    onClick={() => setTab(item.key)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {count !== undefined && <b>{count}</b>}
                    <ChevronRight size={15} />
                  </button>
                );
              })}
            </nav>
            <div className={styles.secureCard}>
              <ShieldCheck size={22} />
              <div>
                <strong>Tài khoản được bảo vệ</strong>
                <span>Thông tin của bạn được mã hóa và bảo mật.</span>
              </div>
            </div>
          </aside>

          <section className={styles.content}>
            {message && (
              <div className={styles.message} role="status" aria-live="polite">
                <BadgeCheck size={17} /> {message}
              </div>
            )}

            {tab === "orders" && (
              <>
                <header className={styles.sectionHead}>
                  <div>
                    <span>LỊCH SỬ MUA HÀNG</span>
                    <h2>Đơn hàng của tôi</h2>
                    <p>Theo dõi tiến trình giao hàng và trạng thái thanh toán.</p>
                  </div>
                </header>
                {orders.length === 0 ? (
                  <div className={styles.empty}>
                    <PackageCheck size={38} />
                    <h3>Bạn chưa có đơn hàng nào</h3>
                    <p>Khám phá sản phẩm phù hợp với lộ trình chăm sóc của bạn.</p>
                    <a href="/shop/all">Khám phá cửa hàng <ChevronRight size={16} /></a>
                  </div>
                ) : (
                  <div className={styles.orderList}>
                    {orders.map((order) => {
                      const currentStep = progressIndex[order.status];
                      const exceptional = ["cancelled", "returned"].includes(order.status);
                      const tracking = trackingUrl(order.shippingProvider, order.trackingNumber);
                      return (
                        <article className={styles.orderCard} key={order._id}>
                          <header className={styles.orderHead}>
                            <div>
                              <span>MÃ ĐƠN HÀNG</span>
                              <strong>{order.orderNumber}</strong>
                              <small>{new Date(order.createdAt).toLocaleString("vi-VN")}</small>
                            </div>
                            <div className={styles.orderStatus}>
                              <span data-status={order.status}>{statusLabel[order.status]}</span>
                              <strong>{money.format(order.total)}</strong>
                            </div>
                          </header>

                          {!exceptional && (
                            <div className={styles.progress}>
                              {progressSteps.map((step, index) => {
                                const Icon = step.icon;
                                const reached = index <= currentStep;
                                return (
                                  <div className={reached ? styles.reached : ""} key={step.status}>
                                    <i><Icon size={15} /></i>
                                    <span>{step.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className={styles.orderItems}>
                            {order.items.slice(0, 3).map((item, index) => (
                              <div className={styles.orderItem} key={`${item.sku || item.name}-${index}`}>
                                <div className={styles.itemImage}>
                                  {item.image ? <img src={item.image} alt="" /> : <Box size={20} />}
                                </div>
                                <div>
                                  <strong>{item.name}</strong>
                                  <span>{item.variantTitle || item.sku || "Sản phẩm CareWise"}</span>
                                </div>
                                <b>×{item.quantity}</b>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <small className={styles.moreItems}>+{order.items.length - 3} sản phẩm khác</small>
                            )}
                          </div>

                          <footer className={styles.orderFooter}>
                            <div className={styles.payment}>
                              <CreditCard size={17} />
                              <span>
                                {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản"}
                                <b>{paymentLabel[order.paymentStatus]}</b>
                              </span>
                            </div>
                            {order.trackingNumber && (
                              tracking ? (
                                <a href={tracking} target="_blank" rel="noreferrer">
                                  Theo dõi vận đơn <ExternalLink size={14} />
                                </a>
                              ) : (
                                <span className={styles.trackingCode}>
                                  {order.shippingProvider && order.shippingProvider !== "manual"
                                    ? providerLabel[order.shippingProvider]
                                    : "Mã vận đơn"}: <b>{order.trackingNumber}</b>
                                </span>
                              )
                            )}
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {tab === "addresses" && (
              <>
                <header className={styles.sectionHead}>
                  <div>
                    <span>GIAO NHẬN THUẬN TIỆN</span>
                    <h2>Sổ địa chỉ</h2>
                    <p>Lưu các địa chỉ thường dùng để đặt hàng nhanh hơn.</p>
                  </div>
                  {!showAddressForm && (
                    <button type="button" onClick={() => setShowAddressForm(true)}>
                      <Plus size={16} /> Thêm địa chỉ
                    </button>
                  )}
                </header>

                {showAddressForm && (
                  <div className={styles.addressForm}>
                    <div className={styles.formTitle}>
                      <div>
                        <span>{editingAddressId ? "CHỈNH SỬA" : "ĐỊA CHỈ MỚI"}</span>
                        <h3>{editingAddressId ? "Cập nhật địa chỉ giao hàng" : "Thêm địa chỉ giao hàng"}</h3>
                      </div>
                      <button type="button" onClick={closeAddressForm} aria-label="Đóng">
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.formGrid}>
                      <label>Người nhận<input required placeholder="Họ và tên" {...addressField("recipientName")} /></label>
                      <label>Số điện thoại<input required inputMode="tel" placeholder="0901 234 567" {...addressField("phone")} /></label>
                      <label>Tỉnh / Thành phố<input required placeholder="Ví dụ: Thành phố Hà Nội" {...addressField("province")} /></label>
                      <label>Quận / Huyện<input placeholder="Ví dụ: Quận Ba Đình" {...addressField("district")} /></label>
                      <label>Phường / Xã<input placeholder="Ví dụ: Phường Ngọc Hà" {...addressField("ward")} /></label>
                      <label>Địa chỉ cụ thể<input required placeholder="Số nhà, tên đường..." {...addressField("addressLine")} /></label>
                    </div>
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={
                          saving === "address" ||
                          !addressForm.recipientName ||
                          !addressForm.phone ||
                          !addressForm.province ||
                          !addressForm.addressLine
                        }
                        onClick={() => void saveAddress()}
                      >
                        <Save size={16} /> {saving === "address" ? "Đang lưu…" : "Lưu địa chỉ"}
                      </button>
                      <button type="button" onClick={closeAddressForm}>Hủy</button>
                    </div>
                  </div>
                )}

                {profile.addresses.length === 0 && !showAddressForm ? (
                  <div className={styles.empty}>
                    <Home size={38} />
                    <h3>Chưa có địa chỉ giao hàng</h3>
                    <p>Thêm địa chỉ để quá trình thanh toán nhanh và chính xác hơn.</p>
                  </div>
                ) : (
                  <div className={styles.addressGrid}>
                    {profile.addresses.map((address) => (
                      <article
                        key={address._id}
                        className={address.isDefault ? styles.defaultAddress : ""}
                      >
                        <header>
                          <div className={styles.addressIcon}><Home size={19} /></div>
                          {address.isDefault && <span><BadgeCheck size={13} /> Mặc định</span>}
                        </header>
                        <h3>{address.recipientName}</h3>
                        <p><Phone size={14} /> {address.phone}</p>
                        <p><MapPin size={14} /> {[address.addressLine, address.ward, address.district, address.province].filter(Boolean).join(", ")}</p>
                        <footer>
                          <button type="button" onClick={() => editAddress(address)}>
                            <Pencil size={14} /> Sửa
                          </button>
                          {!address.isDefault && (
                            <button
                              type="button"
                              disabled={saving === address._id}
                              onClick={() => void setDefaultAddress(address._id)}
                            >
                              Đặt mặc định
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.deleteButton}
                            disabled={saving === address._id}
                            onClick={() => void deleteAddress(address._id)}
                            aria-label="Xóa địa chỉ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </footer>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "profile" && (
              <>
                <header className={styles.sectionHead}>
                  <div>
                    <span>HỒ SƠ CỦA BẠN</span>
                    <h2>Thông tin cá nhân</h2>
                    <p>Cập nhật thông tin để CareWise hỗ trợ bạn tốt hơn.</p>
                  </div>
                </header>
                <div className={styles.profileGrid}>
                  <section className={styles.profileCard}>
                    <div className={styles.cardTitle}>
                      <CircleUserRound size={21} />
                      <div><h3>Thông tin cơ bản</h3><p>Dùng cho đơn hàng và liên hệ.</p></div>
                    </div>
                    <label>Họ và tên<input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} /></label>
                    <label>Email<input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} placeholder="email@example.com" /></label>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={saving === "profile" || profileForm.fullName.trim().length < 2}
                      onClick={() => void saveProfile()}
                    >
                      <Save size={16} /> {saving === "profile" ? "Đang lưu…" : "Lưu thay đổi"}
                    </button>
                  </section>

                  <section className={styles.profileCard}>
                    <div className={styles.cardTitle}>
                      <ShieldCheck size={21} />
                      <div><h3>Bảo mật đăng nhập</h3><p>Số điện thoại dùng để đăng nhập.</p></div>
                    </div>
                    <div className={styles.phoneDisplay}>
                      <Phone size={18} />
                      <div><span>Số điện thoại hiện tại</span><strong>{profile.phone}</strong></div>
                      <BadgeCheck size={17} />
                    </div>
                    {!showPhoneChange ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          setShowPhoneChange(true);
                          setPhoneForm({ phone: profile.phone, currentPassword: "" });
                        }}
                      >
                        <Pencil size={15} /> Đổi số điện thoại
                      </button>
                    ) : (
                      <div className={styles.phoneForm}>
                        <label>Số điện thoại mới<input inputMode="tel" value={phoneForm.phone} onChange={(event) => setPhoneForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                        <label>Mật khẩu hiện tại<input type="password" value={phoneForm.currentPassword} onChange={(event) => setPhoneForm((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
                        <div className={styles.formActions}>
                          <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={saving === "phone" || !phoneForm.phone || !phoneForm.currentPassword}
                            onClick={() => void savePhone()}
                          >
                            {saving === "phone" ? "Đang xác nhận…" : "Xác nhận đổi"}
                          </button>
                          <button type="button" onClick={() => setShowPhoneChange(false)}>Hủy</button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
