"use client";

import NextImage from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  FolderTree,
  Home,
  Image as ImageIcon,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./admin-shell.module.css";

type NotificationItem = {
  _id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

const nav = [
  [Home, "Tổng quan", "/admin"],
  [ShoppingBag, "Đơn hàng", "/admin/orders"],
  [MessageCircle, "Hỗ trợ", "/admin/support"],
  [Package, "Sản phẩm", "/admin/products"],
  [FolderTree, "Danh mục", "/admin/categories"],
  [ImageIcon, "Banner", "/admin/banners"],
  [Tag, "Mã giảm giá", "/admin/coupons"],
  [Users, "Khách hàng", "/admin/customers"],
  [ChartNoAxesCombined, "Báo cáo", "/admin/reports"],
  [Star, "Đánh giá", "/admin/reviews"],
] as const;

const bottomNav = [
  [Home, "Tổng quan", "/admin"],
  [ShoppingBag, "Đơn", "/admin/orders"],
  [Package, "Sản phẩm", "/admin/products"],
  [MessageCircle, "Hỗ trợ", "/admin/support"],
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (
      (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
    ).toUpperCase() || "AD"
  );
}

function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email?: string } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((body) => setUser(body.data ?? null));
  }, []);
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  const name = user?.fullName ?? "Quản trị viên";
  return (
    <div className={styles.userWrap} ref={ref}>
      <button
        type="button"
        className={styles.user}
        onClick={() => setOpen((value) => !value)}
      >
        <div>{initials(name)}</div>
        <span>
          <b>{name}</b>
          <small>Quản trị viên</small>
        </span>
        <ChevronDown size={15} className={open ? styles.userChevronOpen : ""} />
      </button>
      {open && (
        <div className={styles.userMenu}>
          {user?.email && (
            <div className={styles.userMenuEmail}>{user.email}</div>
          )}
          <button type="button" onClick={() => void logout()}>
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    const body = await response.json();
    setItems(body.data ?? []);
    setUnread(body.unread ?? 0);
  }, []);

  useEffect(() => {
    const start = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  return (
    <div className={styles.notificationWrap} ref={ref}>
      <button
        className={styles.iconButton}
        aria-label="Thông báo"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={19} />
        {unread > 0 && <i />}
      </button>
      {open && (
        <div className={styles.notificationPanel}>
          <div className={styles.notificationHead}>
            <b>Thông báo</b>
            <button onClick={() => void markAllRead()}>Đánh dấu đã đọc</button>
          </div>
          <div className={styles.notificationList}>
            {items.length === 0 ? (
              <p>Chưa có thông báo nào.</p>
            ) : (
              items.map((item) => (
                <Link
                  href={item.href || "/admin"}
                  key={item._id}
                  className={!item.readAt ? styles.unreadNotification : ""}
                  onClick={() => setOpen(false)}
                >
                  <strong>{item.title}</strong>
                  {item.body && <span>{item.body}</span>}
                  <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminShell({
  breadcrumb,
  children,
}: {
  breadcrumb: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={styles.admin}>
      {menuOpen && (
        <button
          className={styles.mobileBackdrop}
          onClick={() => setMenuOpen(false)}
          aria-label="Đóng menu"
        />
      )}
      <aside
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brandRow}>
          <Link href="/" className={styles.brand}>
            <NextImage
              src="/images/logocarewise.png"
              alt="CareWise"
              width={1536}
              height={1024}
              className={styles.brandLogo}
              priority
            />
          </Link>
          <button onClick={() => setMenuOpen(false)} aria-label="Đóng menu">
            <X />
          </button>
        </div>
        <div className={styles.workspace}>
          <span>KHÔNG GIAN LÀM VIỆC</span>
          <button>
            Tóc Tai Thương mại <ChevronDown size={14} />
          </button>
        </div>
        <nav>
          {nav.map(([Icon, label, href]) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                href={href}
                key={label}
                onClick={() => setMenuOpen(false)}
                className={active ? styles.activeNav : ""}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <button>
            <Settings size={19} />
            <span>Cài đặt</span>
          </button>
          <button>
            <CircleHelp size={19} />
            <span>Trung tâm hỗ trợ</span>
          </button>
          <UserMenu />
        </div>
      </aside>
      <main className={styles.content}>
        <header className={styles.topbar}>
          <button
            className={styles.menu}
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
          >
            <Menu />
          </button>
          <div className={styles.breadcrumb}>
            <span>Thương mại</span>
            <b>/</b>
            <strong>{breadcrumb}</strong>
          </div>
          <div className={styles.topActions}>
            <button className={styles.search}>
              <Search size={18} />
              <span>Tìm kiếm</span>
              <kbd>⌘ K</kbd>
            </button>
            <NotificationBell />
            <div className={styles.mobileUser}>AD</div>
          </div>
        </header>
        {children}
      </main>
      <nav className={styles.bottomNav} aria-label="Điều hướng admin">
        {bottomNav.map(([Icon, label, href]) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              href={href}
              key={href}
              className={active ? styles.bottomNavActive : ""}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setMenuOpen(true)}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
