"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./ContactButtons.module.css";

const ICONS = {
  "contact-call": "https://img.icons8.com/color/48/whatsapp--v1.png",
  "contact-zalo": "https://img.icons8.com/color/48/zalo.png",
  "contact-fanpage": "https://img.icons8.com/color/48/facebook-new.png",
} as const;

const SLOTS = [
  { key: "contact-zalo", label: "Nhắn Zalo" },
  { key: "contact-call", label: "Gọi điện" },
  { key: "contact-fanpage", label: "Fanpage" },
] as const;

export function ContactButtons() {
  const pathname = usePathname();
  const [hrefs, setHrefs] = useState<Record<string, string>>({});
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    if (hidden) return;
    fetch("/api/banners?placement=site_contact_buttons")
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((body) => {
        const list = (body.data ?? []) as Array<{ slotKey: string; ctaHref: string }>;
        setHrefs(
          Object.fromEntries(
            list.map((item) => [item.slotKey, item.ctaHref]).filter(([, href]) => href),
          ),
        );
      })
      .catch(() => undefined);
  }, [hidden]);

  if (hidden) return null;
  const visible = SLOTS.filter(({ key }) => hrefs[key]);
  if (!visible.length) return null;

  return (
    <div className={styles.stack}>
      {visible.map(({ key, label }) => (
        <a
          key={key}
          href={hrefs[key]}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={styles.button}
        >
          <img src={ICONS[key]} alt="" width={26} height={26} />
        </a>
      ))}
    </div>
  );
}
