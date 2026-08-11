"use client";

import Link from "next/link";
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import styles from "./SiteChrome.module.css";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState(0);

  return (
    <div className={styles.root}>
      {!compact && <div className={styles.promo}>
        MIỄN PHÍ VẬN CHUYỂN CHO ĐƠN HÀNG TỪ 499.000đ
        <button>Khám phá routine</button>
      </div>}
      <div className={styles.headerWrap}>
        <header className={styles.header}>
          <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <Link href="/" className={styles.textLogo}>TÓC<i>TAI</i><small>STUDIO</small></Link>
          <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
            <a href="/login">Đăng nhập</a>
            <Link href="/">Trang chủ</Link>
            <button>
              Chọn theo nhu cầu <ChevronDown size={14} />
            </button>
            <a href="/shop/all">Sản phẩm</a>
            <a href="/habit/honest-report">Cẩm nang tóc</a>
            <a href="/pages/hair-form-assessment">Kiểm tra tóc</a>
          </nav>
          <div className={styles.actions}>
            <button aria-label="Search">
              <Search size={20} />
            </button>
            <button aria-label="Profile">
              <UserRound size={20} />
            </button>
            <button className={styles.bag} aria-label="Cart" onClick={() => setCart((v) => v + 1)}>
              <ShoppingBag size={20} />
              {cart > 0 && <b>{cart}</b>}
            </button>
          </div>
        </header>
      </div>
    </div>
  );
}
