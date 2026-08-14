"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./ContactButtons.module.css";

const SLOTS = [
  { key: "contact-zalo", label: "Nhắn Zalo", kind: "zalo" },
  { key: "contact-call", label: "Gọi điện", kind: "call" },
  { key: "contact-fanpage", label: "Fanpage", kind: "facebook" },
] as const;

const ICONS = {
  zalo: "https://img.icons8.com/color/96/zalo.png",
  call: "https://img.icons8.com/color/96/phone.png",
  facebook: "https://img.icons8.com/color/96/facebook-new.png",
} as const;

export function ContactButtons() {
  const pathname = usePathname();
  const [hrefs, setHrefs] = useState<Record<string, string>>({});
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    if (hidden) return;
    const controller = new AbortController();
    fetch("/api/banners?placement=site_contact_buttons", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((body) => {
        const list = (body.data ?? []) as Array<{
          slotKey: string;
          ctaHref: string;
          isActive?: boolean;
        }>;
        setHrefs(
          Object.fromEntries(
            list
              .filter((item) => item.isActive !== false && item.ctaHref?.trim())
              .map((item) => [item.slotKey, item.ctaHref.trim()]),
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHrefs({});
      });
    return () => controller.abort();
  }, [hidden]);

  if (hidden) return null;
  const visible = SLOTS.filter(({ key }) => hrefs[key]);
  if (!visible.length) return null;

  return (
    <aside className={styles.stack} aria-label="Liên hệ nhanh">
      {visible.map(({ key, label, kind }) => {
        const external = !hrefs[key].startsWith("tel:");
        return (
          <a
            key={key}
            href={hrefs[key]}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            aria-label={label}
            className={styles.button}
            data-kind={kind}
          >
            <span className={styles.tooltip}>{label}</span>
            <img src={ICONS[kind]} alt="" width={34} height={34} />
          </a>
        );
      })}
    </aside>
  );
}
