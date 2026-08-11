"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import styles from "./SiteChrome.module.css";

const asset = "/sites/manmatters-com-61d14dee/root-8a5edab2/";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState(0);

  return (
    <div className={styles.root}>
      <div className={styles.promo}>
        Use MM Wallet and save upto 30%
        <button>Download App</button>
      </div>
      <div className={styles.headerWrap}>
        <header className={styles.header}>
          <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <Link href="/">
            <Image className={styles.logo} src={`${asset}logo.png`} alt="Man Matters" width={150} height={41} priority />
          </Link>
          <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
            <a href="/login">Login</a>
            <Link href="/">Home</Link>
            <button>
              Choose Product <ChevronDown size={14} />
            </button>
            <a href="/shop/all">All Products</a>
            <a href="/habit/honest-report">Honest Reports</a>
            <a href="/pages/hair-form-assessment">Hair Assessment</a>
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
