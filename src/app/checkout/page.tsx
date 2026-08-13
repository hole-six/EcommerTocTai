"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import { useCart } from "@/contexts/CartContext";

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
type AddressForm = {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
};
type Division = { code: number; name: string; division_type: string };
type TransferPayment = {
  paymentCode: string;
  bank: string;
  account: string;
  accountHolder: string;
  amount: number;
  qrUrl: string;
};
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
const canUseNewAddress = (address: AddressForm) =>
  Boolean(
    address.recipientName &&
    address.phone &&
    address.province &&
    address.ward &&
    address.addressLine,
  );
const paymentMethods = [
  ["cod", "Thanh toán khi nhận hàng", "Kiểm tra hàng trước khi thanh toán"],
  [
    "bank_transfer",
    "Chuyển khoản ngân hàng",
    "Xác nhận tự động sau khi thanh toán",
  ],
] as const;
const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";

export default function CheckoutPage() {
  const { items, subtotal, setQuantity, removeItem, clear } = useCart();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [contact, setContact] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [recipientDifferent, setRecipientDifferent] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [stockError, setStockError] = useState("");
  const [provinces, setProvinces] = useState<Division[]>([]);
  const [wards, setWards] = useState<Division[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof paymentMethods)[number][0]>("cod");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: "percent" | "fixed";
    value: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [transferPayment, setTransferPayment] =
    useState<TransferPayment | null>(null);
  const [transferPaid, setTransferPaid] = useState(false);
  const appliedCouponCode = appliedCoupon?.code;
  useEffect(() => {
    const savedPhone = localStorage.getItem("toctai_checkout_phone") ?? "";
    setVerifiedPhone(savedPhone);
    setPhoneInput(savedPhone);
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((body) => {
        if (!body.data) return;
        return fetch("/api/account")
          .then((response) => response.json())
          .then((account) => {
            const data: Profile = account.data;
            setProfile(data);
            setVerifiedPhone(data.phone);
            setContact({
              fullName: data.fullName,
              phone: data.phone,
              email: data.email ?? "",
            });
            const saved =
              data.addresses?.find((address) => address.isDefault) ??
              data.addresses?.[0];
            if (saved) {
              setAddressMode("saved");
              setSelectedAddressId(saved._id);
            }
          });
      })
      .finally(() => setProfileLoading(false));
  }, []);
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/v2/p/")
      .then((response) => response.json())
      .then((data: Division[]) => setProvinces(data))
      .catch(() => setError("Không tải được danh mục tỉnh/thành."));
  }, []);
  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    setAddressLoading(true);
    fetch(`https://provinces.open-api.vn/api/v2/w/?province=${provinceCode}`)
      .then((response) => response.json())
      .then((data: Division[]) => setWards(data))
      .catch(() => setError("Không tải được phường/xã."))
      .finally(() => setAddressLoading(false));
  }, [provinceCode]);
  useEffect(() => {
    let cancelled = false;
    async function loadStock() {
      const entries = await Promise.all(
        items.map(async (item) => {
          const response = await fetch(
            `/api/commerce/products/${item.productId}`,
          );
          const body = await response.json();
          const available = response.ok
            ? Math.max(
                0,
                Number(body.data.inventory ?? 0) -
                  Number(body.data.reservedInventory ?? 0),
              )
            : 0;
          return [item.productId, available] as const;
        }),
      );
      if (!cancelled) setStock(Object.fromEntries(entries));
    }
    if (items.length) void loadStock();
    else setStock({});
    return () => {
      cancelled = true;
    };
  }, [items]);
  useEffect(() => {
    if (!appliedCouponCode) return;
    const timer = window.setTimeout(() => {
      fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedCouponCode, subtotal }),
      })
        .then((response) =>
          response.json().then((body) => ({ response, body })),
        )
        .then(({ response, body }) => {
          if (!response.ok) {
            setAppliedCoupon(null);
            setCouponError(body.error ?? "Mã giảm giá không còn áp dụng được.");
            return;
          }
          setAppliedCoupon({
            code: body.data.code,
            discount: body.data.discount,
            type: body.data.type,
            value: body.data.value,
          });
        })
        .catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [subtotal, appliedCouponCode]);
  useEffect(() => {
    if (!orderNumber || !transferPayment || transferPaid) return;
    const check = () =>
      fetch(`/api/orders/${orderNumber}/payment`)
        .then((response) => response.json())
        .then((body) => {
          if (body.data?.paymentStatus === "paid") setTransferPaid(true);
        })
        .catch(() => undefined);
    void check();
    const timer = window.setInterval(check, 3000);
    return () => window.clearInterval(timer);
  }, [orderNumber, transferPaid, transferPayment]);
  const shippingFee = subtotal >= 499000 || subtotal === 0 ? 0 : 30000;
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal + shippingFee - discount);
  const selectedAddress =
    addressMode === "saved"
      ? (profile?.addresses.find(
          (address) => address._id === selectedAddressId,
        ) ?? null)
      : null;
  const currentNewAddress: AddressForm = {
    ...addressForm,
    recipientName: recipientDifferent
      ? addressForm.recipientName
      : contact.fullName,
    phone: recipientDifferent
      ? addressForm.phone
      : contact.phone || verifiedPhone,
  };
  const addressPreview = selectedAddress ?? currentNewAddress;
  const deliveryAddress =
    selectedAddress ??
    (canUseNewAddress(currentNewAddress) ? currentNewAddress : null);
  const phoneReady = Boolean(profile || verifiedPhone);
  const changeAddress = <K extends keyof AddressForm>(
    key: K,
    value: AddressForm[K],
  ) => {
    setAddressForm((current) => ({ ...current, [key]: value }));
  };
  async function increaseQuantity(lineId: string, productId: string, quantity: number) {
    setStockError("");
    const available = stock[productId];
    const currentTotal = items
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (available === undefined)
      return setStockError(
        "Đang kiểm tra tồn kho, vui lòng thử lại sau giây lát.",
      );
    if (currentTotal >= available)
      return setStockError(
        `Sản phẩm chỉ còn ${available} sản phẩm có thể đặt.`,
      );
    setQuantity(lineId, quantity + 1);
  }
  function verifyPhone() {
    const phone = phoneInput.replace(/\s/g, "");
    if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone)) {
      setError("Nhập số điện thoại Việt Nam hợp lệ để tiếp tục.");
      return;
    }
    localStorage.setItem("toctai_checkout_phone", phone);
    setVerifiedPhone(phone);
    setContact((current) => ({ ...current, phone }));
    setAddressForm((current) => ({ ...current, phone }));
    setError("");
  }
  function chooseProvince(code: string) {
    const province = provinces.find((item) => String(item.code) === code);
    setProvinceCode(code);
    setWardCode("");
    changeAddress("province", province?.name ?? "");
    changeAddress("district", "");
    changeAddress("ward", "");
  }
  function chooseWard(code: string) {
    const ward = wards.find((item) => String(item.code) === code);
    setWardCode(code);
    changeAddress("ward", ward?.name ?? "");
  }
  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponError("");
    const response = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput.trim(), subtotal }),
    });
    const body = await response.json();
    if (!response.ok) {
      setAppliedCoupon(null);
      setCouponError(body.error ?? "Mã giảm giá không hợp lệ.");
      return;
    }
    setAppliedCoupon({
      code: body.data.code,
      discount: body.data.discount,
      type: body.data.type,
      value: body.data.value,
    });
  }
  async function submit() {
    setError("");
    if (!phoneReady) return setError("Vui lòng xác thực số điện thoại trước.");
    if (!items.length) return setError("Giỏ hàng đang trống.");
    if (!deliveryAddress)
      return setError("Vui lòng nhập đầy đủ địa chỉ giao hàng.");
    const requestedByProduct = items.reduce<Record<string, number>>(
      (result, item) => ({
        ...result,
        [item.productId]: (result[item.productId] ?? 0) + item.quantity,
      }),
      {},
    );
    if (
      Object.entries(requestedByProduct).some(
        ([productId, quantity]) =>
          stock[productId] === undefined || quantity > stock[productId],
      )
    )
      return setError(
        "Một hoặc nhiều sản phẩm đã vượt quá tồn kho hiện có. Vui lòng điều chỉnh số lượng.",
      );
    const customer = {
      ...contact,
      phone: contact.phone || verifiedPhone,
      fullName: contact.fullName || deliveryAddress.recipientName,
    };
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shippingAddress: deliveryAddress,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId,
            options: (item.options ?? []).map((option) => ({
              groupCode: option.groupCode,
              optionValue: option.optionValue,
            })),
          })),
          note,
          paymentMethod,
          saveAddress: Boolean(profile) && addressMode === "new",
          couponCode: appliedCoupon?.code,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Đặt hàng thất bại");
      clear();
      setOrderNumber(body.data.orderNumber);
      setTransferPayment(body.payment ?? null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Đặt hàng thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  }
  if (orderNumber && transferPayment && !transferPaid)
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader compact />
        <main className="mx-auto max-w-md px-5 py-12">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="bg-gradient-to-br from-[#064f96] to-[#1677c2] p-6 text-white">
              <Clock3 size={28} />
              <h1 className="mt-3 text-2xl font-black">
                Chờ thanh toán chuyển khoản
              </h1>
              <p className="mt-2 text-sm text-blue-100">
                Quét QR hoặc chuyển đúng số tiền với nội dung bên dưới. Đơn tự
                xác nhận ngay khi SePay nhận tiền.
              </p>
            </div>
            <div className="p-6 text-center">
              <img
                src={transferPayment.qrUrl}
                alt="Mã QR thanh toán chuyển khoản"
                className="mx-auto w-64 max-w-full rounded-xl border border-slate-100"
              />
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Số tiền cần chuyển
              </p>
              <b className="mt-1 block text-2xl text-slate-900">
                {money.format(transferPayment.amount)}
              </b>
              <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
                <p>
                  <span className="text-slate-500">Ngân hàng:</span>{" "}
                  <b>{transferPayment.bank}</b>
                </p>
                <p>
                  <span className="text-slate-500">Số tài khoản:</span>{" "}
                  <b>{transferPayment.account}</b>
                </p>
                {transferPayment.accountHolder && (
                  <p>
                    <span className="text-slate-500">Chủ tài khoản:</span>{" "}
                    <b>{transferPayment.accountHolder}</b>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(transferPayment.paymentCode)
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 font-bold text-blue-700"
                >
                  <span>Nội dung: {transferPayment.paymentCode}</span>
                  <Copy size={15} />
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Trang đang tự kiểm tra thanh toán mỗi 3 giây.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  if (orderNumber)
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader compact />
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
          <h1 className="mt-5 text-3xl font-black text-slate-900">
            Đặt hàng thành công
          </h1>
          <p className="mt-3 text-slate-600">
            Mã đơn của bạn: <b className="text-blue-700">{orderNumber}</b>. Tồn
            kho đã được giữ chỗ cho đơn này.
          </p>
          <Link
            href="/cua-hang"
            className="mt-8 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white"
          >
            Tiếp tục mua sắm
          </Link>
        </main>
      </div>
    );
  if (!phoneReady && !profileLoading)
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader compact />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#064f96] to-[#1677c2] p-7 text-white">
              <UserRound size={30} />
              <h1 className="mt-4 text-2xl font-black">Trước khi thanh toán</h1>
              <p className="mt-2 text-sm text-blue-100">
                Xác thực số điện thoại để nhận thông tin đơn hàng và giao hàng
                chính xác.
              </p>
            </div>
            <div className="p-7">
              <label className="text-sm font-bold text-slate-800">
                Số điện thoại
              </label>
              <input
                autoFocus
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && verifyPhone()}
                className={`${field} mt-2`}
                placeholder="Ví dụ: 0901 234 567"
              />
              <button
                onClick={verifyPhone}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 text-sm font-bold text-white hover:bg-blue-800"
              >
                Tiếp tục <ChevronRight size={17} />
              </button>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
                hoặc
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login?next=/checkout"
                  className="rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-bold text-slate-700"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-center text-sm font-bold text-blue-700"
                >
                  Đăng ký
                </Link>
              </div>
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
          </section>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader compact />
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[.16em] text-blue-600">
              CHECKOUT BẢO MẬT
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Hoàn tất đơn hàng
            </h1>
          </div>
          <span className="hidden items-center gap-2 text-xs font-bold text-emerald-700 sm:flex">
            <ShieldCheck size={17} /> Thanh toán được bảo vệ
          </span>
        </div>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_390px]">
          <section className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-slate-900">
                  1. Thông tin liên hệ
                </h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  Đã xác thực
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className={field}
                  placeholder="Họ và tên"
                  value={contact.fullName}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                />
                <input
                  className={field}
                  value={contact.phone || verifiedPhone}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="Số điện thoại"
                />
                <input
                  className={`${field} sm:col-span-2`}
                  value={contact.email}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Email nhận thông tin đơn hàng (không bắt buộc)"
                />
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <MapPin className="text-blue-600" size={19} />
                <h2 className="font-extrabold text-slate-900">
                  2. Địa chỉ giao hàng
                </h2>
              </div>
              {profile?.addresses.length ? (
                <div className="mt-4 grid gap-3">
                  {profile.addresses.map((address) => (
                    <button
                      key={address._id}
                      onClick={() => {
                        setAddressMode("saved");
                        setSelectedAddressId(address._id);
                      }}
                      className={`rounded-xl border p-4 text-left transition ${selectedAddressId === address._id && addressMode === "saved" ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}
                    >
                      <b className="text-sm text-slate-900">
                        {address.recipientName} · {address.phone}
                      </b>
                      <p className="mt-1 text-sm text-slate-600">
                        {[
                          address.addressLine,
                          address.ward,
                          address.district,
                          address.province,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setAddressMode("new");
                      setRecipientDifferent(false);
                    }}
                    className={`rounded-xl border border-dashed p-3 text-sm font-bold ${addressMode === "new" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600"}`}
                  >
                    + Dùng địa chỉ mới
                  </button>
                </div>
              ) : null}
              {addressMode === "new" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRecipientDifferent((value) => !value)}
                    className="sm:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left text-sm text-slate-700"
                  >
                    <span>
                      <b className="block text-slate-900">
                        {recipientDifferent
                          ? "Giao cho người khác"
                          : "Giao cho tôi"}
                      </b>
                      <small className="text-slate-500">
                        {recipientDifferent
                          ? "Nhập tên và số điện thoại người nhận"
                          : `${contact.fullName || "Tên liên hệ"} · ${contact.phone || verifiedPhone || "Số điện thoại liên hệ"}`}
                      </small>
                    </span>
                    <span className="font-bold text-blue-700">
                      {recipientDifferent
                        ? "Dùng thông tin liên hệ"
                        : "Giao cho người khác"}
                    </span>
                  </button>
                  {recipientDifferent && (
                    <>
                      <input
                        className={field}
                        placeholder="Tên người nhận"
                        value={addressForm.recipientName}
                        onChange={(event) =>
                          changeAddress("recipientName", event.target.value)
                        }
                      />
                      <input
                        className={field}
                        placeholder="Số điện thoại người nhận"
                        value={addressForm.phone}
                        onChange={(event) =>
                          changeAddress("phone", event.target.value)
                        }
                      />
                    </>
                  )}
                  <select
                    className={field}
                    value={provinceCode}
                    onChange={(event) => chooseProvince(event.target.value)}
                  >
                    <option value="">Chọn Tỉnh / Thành phố</option>
                    {provinces.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={field}
                    disabled={!provinceCode || addressLoading}
                    value={wardCode}
                    onChange={(event) => chooseWard(event.target.value)}
                  >
                    <option value="">
                      {addressLoading
                        ? "Đang tải phường/xã..."
                        : "Chọn Phường / Xã"}
                    </option>
                    {wards.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className={`${field} sm:col-span-2`}
                    placeholder="Số nhà, tên đường, tòa nhà..."
                    value={addressForm.addressLine}
                    onChange={(event) =>
                      changeAddress("addressLine", event.target.value)
                    }
                  />
                  <p className="text-xs text-slate-500 sm:col-span-2">
                    Danh mục địa giới hành chính Việt Nam mới (sau sáp nhập
                    2025).
                  </p>
                  <div className="sm:col-span-2 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4 text-sm text-blue-900">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                      <MapPin size={15} /> Xem trước địa chỉ giao hàng
                    </p>
                    <p className="mt-2 font-bold">
                      {currentNewAddress.recipientName || "Tên người nhận"}
                      {currentNewAddress.phone
                        ? ` · ${currentNewAddress.phone}`
                        : ""}
                    </p>
                    <p className="mt-1 leading-6 text-blue-800">
                      {[
                        addressForm.addressLine || "Số nhà, tên đường",
                        addressForm.ward || "Phường / xã",
                        addressForm.province || "Tỉnh / thành phố",
                      ].join(", ")}
                    </p>
                    {!canUseNewAddress(currentNewAddress) && (
                      <p className="mt-2 text-xs text-blue-600">
                        Điền đủ thông tin để có thể đặt hàng. Khung này tự cập
                        nhật khi bạn nhập.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold text-slate-900">
                3. Phương thức thanh toán
              </h2>
              <div className="mt-4 grid gap-2">
                {paymentMethods.map(([value, label, detail]) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMethod(value)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left ${paymentMethod === value ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200"}`}
                  >
                    <i
                      className={`grid h-5 w-5 place-items-center rounded-full border-2 ${paymentMethod === value ? "border-blue-600" : "border-slate-300"}`}
                    >
                      {paymentMethod === value && (
                        <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      )}
                    </i>
                    <span>
                      <b className="block text-sm text-slate-900">{label}</b>
                      <small className="text-xs text-slate-500">{detail}</small>
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                className={`${field} mt-4 min-h-20`}
                placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </section>
          </section>
          <aside className="h-fit lg:sticky lg:top-20">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
              <div className="border-b border-slate-100 p-5">
                <h2 className="font-extrabold text-slate-900">
                  Tóm tắt đơn hàng
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {items.length} sản phẩm trong giỏ
                </p>
              </div>
              <div className="max-h-64 divide-y divide-slate-100 overflow-auto px-5">
                {items.map((item) => (
                  <div
                    key={item.lineId}
                    className="flex items-center gap-3 py-4"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <b className="line-clamp-1 text-sm text-slate-800">
                        {item.name}
                      </b>
                      <small className="mt-1 block text-slate-500">
                        {money.format(item.price)}
                      </small>
                      {item.variantTitle && (
                        <small className="mt-1 block text-blue-700">
                          {item.variantTitle}
                        </small>
                      )}
                    </div>
                    <div className="flex items-center rounded-lg border border-slate-200">
                      <button
                        onClick={() =>
                          setQuantity(item.lineId, item.quantity - 1)
                        }
                        className="p-1.5 text-slate-500"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          void increaseQuantity(item.lineId, item.productId, item.quantity)
                        }
                        disabled={
                          stock[item.productId] !== undefined &&
                          item.quantity >= stock[item.productId]
                        }
                        aria-label="Tăng số lượng"
                        className="p-1.5 text-slate-500"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.lineId)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 p-5">
                <div className="flex gap-2">
                  <input
                    className={`${field} py-2.5`}
                    placeholder="Mã giảm giá"
                    value={couponInput}
                    onChange={(event) =>
                      setCouponInput(event.target.value.toUpperCase())
                    }
                  />
                  <button
                    onClick={applyCoupon}
                    className="rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700"
                  >
                    Áp dụng
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700">
                    <span>
                      Đã áp dụng {appliedCoupon.code} · −
                      {money.format(discount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponInput("");
                      }}
                      className="text-emerald-800 underline"
                    >
                      Bỏ mã
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-xs text-red-600">{couponError}</p>
                )}
                {stockError && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {stockError}
                  </p>
                )}
                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p className="flex justify-between">
                    <span>Tạm tính</span>
                    <b>{money.format(subtotal)}</b>
                  </p>
                  <p className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <b>
                      {shippingFee ? (
                        money.format(shippingFee)
                      ) : (
                        <span className="text-emerald-600">Miễn phí</span>
                      )}
                    </b>
                  </p>
                  {discount > 0 && (
                    <p className="flex justify-between text-emerald-600">
                      <span>Giảm giá</span>
                      <b>−{money.format(discount)}</b>
                    </p>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-900">
                    <span>Tổng cộng</span>
                    <span>{money.format(total)}</span>
                  </div>
                </div>
                {addressPreview && (
                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold text-blue-800">
                      <MapPin size={14} /> Giao đến
                    </p>
                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      {[
                        addressPreview.addressLine || "Số nhà, tên đường",
                        addressPreview.ward || "Phường / xã",
                        addressPreview.district,
                        addressPreview.province || "Tỉnh / thành phố",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
                <button
                  onClick={submit}
                  disabled={submitting || !items.length}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#07579e] to-[#1677c2] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting
                    ? "Đang tạo đơn..."
                    : `Đặt hàng · ${money.format(total)}`}
                </button>
                {error && (
                  <p className="mt-3 text-center text-xs font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
