"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Home,
  Menu,
  Search,
  ShoppingBag,
  Store,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import styles from "./SiteChrome.module.css";

type SessionUser = {
  id: string;
  fullName: string;
  role: "customer" | "admin";
} | null;
type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  children?: { _id: string; name: string; slug: string }[];
};
type NotificationItem = {
  _id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

type BottomNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const bottomNavItems: BottomNavItem[] = [
  {
    href: "/",
    label: "Trang chủ",
    icon: Home,
    isActive: (pathname) => pathname === "/" || pathname === "/home",
  },
  {
    href: "/shop/all",
    label: "Cửa hàng",
    icon: Store,
    isActive: (pathname) =>
      pathname.startsWith("/shop") ||
      pathname.startsWith("/san-pham") ||
      pathname === "/cua-hang",
  },
  {
    href: "/hair-form",
    label: "Kiểm tra",
    icon: ClipboardList,
    isActive: (pathname) =>
      pathname.startsWith("/pages/hair-form-assessment") ||
      pathname.startsWith("/hair-form"),
  },
  {
    href: "/checkout",
    label: "Giỏ hàng",
    icon: ShoppingBag,
    isActive: (pathname) => pathname.startsWith("/checkout"),
  },
  {
    href: "/account",
    label: "Tài khoản",
    icon: UserRound,
    isActive: (pathname) =>
      pathname.startsWith("/account") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register"),
  },
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [user, setUser] = useState<SessionUser>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const catRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((body) => setUser(body.data));
    fetch("/api/categories?tree=true")
      .then((response) => response.json())
      .then((body) => setCategories(body.data ?? []));
  }, []);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    const body = await response.json();
    setNotifications(body.data ?? []);
    setUnread(body.unread ?? 0);
  }, []);

  useEffect(() => {
    if (!user) return;
    const start = window.setTimeout(() => void loadNotifications(), 0);
    const timer = window.setInterval(() => void loadNotifications(), 18000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [loadNotifications, user]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (catRef.current && !catRef.current.contains(event.target as Node))
        setCatOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (noticeRef.current && !noticeRef.current.contains(event.target as Node))
        setNoticeOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  async function markNotificationsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await loadNotifications();
  }

  return (
    <div className={styles.root}>
      {!compact && (
        <div className={styles.promo}>
          MIỄN PHÍ VẬN CHUYỂN CHO ĐƠN HÀNG TỪ 499.000đ
          <button onClick={() => router.push("/shop/all")}>
            Khám phá sản phẩm
          </button>
        </div>
      )}
      <div className={styles.headerWrap}>
        <header className={styles.header}>
          <button
            className={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Mở menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <Link href="/" className={styles.textLogo}>
            <Image
              src="/images/logocarewise.png"
              alt="CareWise"
              width={1536}
              height={1024}
              className={styles.logoImg}
              priority
            />
          </Link>
          <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
            <div className={styles.mobileNavTitle}>
              <span>KHÁM PHÁ TÓC TAI</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={19} />
              </button>
            </div>
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Trang chủ
            </Link>
            <div className={styles.navItem} ref={catRef}>
              <button
                onClick={() => setCatOpen((value) => !value)}
                aria-expanded={catOpen}
              >
                Chọn theo nhu cầu <ChevronDown size={14} />
              </button>
              {catOpen && (
                <div className={styles.categoryMenu}>
                  <Link
                    href="/shop/all"
                    className={styles.categoryAll}
                    onClick={() => setCatOpen(false)}
                  >
                    Tất cả sản phẩm
                  </Link>
                  {categories.length === 0 && (
                    <span className={styles.categoryEmpty}>
                      Chưa có danh mục nào
                    </span>
                  )}
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/shop/${category.slug}`}
                      className={styles.categoryGroup}
                      onClick={() => setCatOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/shop/all" onClick={() => setMenuOpen(false)}>
              Sản phẩm
            </Link>
            <Link
              href="/hair-form"
              onClick={() => setMenuOpen(false)}
            >
              Kiểm tra tóc
            </Link>
          </nav>
          <div className={styles.actions}>
            {user ? (
              <div className={styles.accountMenu}>
                <button
                  type="button"
                  className={styles.accountButton}
                  onClick={() => setAccountOpen((value) => !value)}
                  aria-expanded={accountOpen}
                >
                  <UserRound size={17} />{" "}
                  {user.role === "admin" ? "Quản trị" : user.fullName}{" "}
                  <ChevronDown size={14} />
                </button>
                {accountOpen && (
                  <div className={styles.accountDropdown}>
                    <Link
                      href={user.role === "admin" ? "/admin" : "/account"}
                      onClick={() => setAccountOpen(false)}
                    >
                      {user.role === "admin"
                        ? "Trang quản trị"
                        : "Tài khoản của tôi"}
                    </Link>
                    <button type="button" onClick={logout}>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={styles.loginButton}>
                Đăng nhập
              </Link>
            )}
            {user && (
              <div className={styles.noticeMenu} ref={noticeRef}>
                <button
                  type="button"
                  className={styles.noticeButton}
                  onClick={() => setNoticeOpen((value) => !value)}
                  aria-label="Thông báo"
                >
                  <Bell size={19} />
                  {unread > 0 && <b>{unread}</b>}
                </button>
                {noticeOpen && (
                  <div className={styles.noticeDropdown}>
                    <div className={styles.noticeHead}>
                      <strong>Thông báo</strong>
                      <button type="button" onClick={() => void markNotificationsRead()}>
                        Đã đọc
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p>Chưa có thông báo nào.</p>
                    ) : (
                      notifications.map((item) => (
                        <Link
                          key={item._id}
                          href={item.href || "/account"}
                          className={!item.readAt ? styles.noticeUnread : ""}
                          onClick={() => setNoticeOpen(false)}
                        >
                          <strong>{item.title}</strong>
                          {item.body && <span>{item.body}</span>}
                          <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <button aria-label="Tìm kiếm">
              <Search size={20} />
            </button>
            <Link href={user ? "/account" : "/login"} aria-label="Tài khoản">
              <UserRound size={20} />
            </Link>
            <Link href="/checkout" className={styles.bag} aria-label="Giỏ hàng">
              <ShoppingBag size={20} />
              {count > 0 && <b>{count}</b>}
            </Link>
          </div>
        </header>
        {menuOpen && (
          <button
            className={styles.mobileBackdrop}
            onClick={() => setMenuOpen(false)}
            aria-label="Đóng menu"
          />
        )}
      </div>
      <nav className={styles.bottomNav} aria-label="Điều hướng chính">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const href =
            item.href === "/account" && !user ? "/login" : item.href;
          const active = item.isActive(pathname);

          return (
            <Link
              href={href}
              key={item.href}
              className={active ? styles.bottomNavActive : ""}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.bottomNavIcon}>
                <Icon size={21} strokeWidth={active ? 2.6 : 2.2} />
                {item.href === "/checkout" && count > 0 && <b>{count}</b>}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
