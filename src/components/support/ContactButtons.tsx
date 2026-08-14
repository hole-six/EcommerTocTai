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
  zalo: "/icons/icons8-zalo-48.png",
  call: "/icons/icons8-whatsapp-logo-48.png",
  facebook: "/icons/icons8-facebook-48.png",
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

  return (
    <aside className={styles.stack} aria-label="Liên hệ nhanh">
      {SLOTS.map(({ key, label, kind }) => {
        const href = hrefs[key];
        const content = (
          <>
            <span className={styles.tooltip}>{label}</span>
            <img src={ICONS[kind]} alt="" width={34} height={34} />
          </>
        );
        if (!href) {
          return (
            <span
              key={key}
              className={`${styles.button} ${styles.disabledButton}`}
              aria-label={`${label} chưa được cấu hình`}
              aria-disabled="true"
              data-kind={kind}
            >
              {content}
            </span>
          );
        }
        const external = !href.startsWith("tel:");
        return (
          <a
            key={key}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            aria-label={label}
            className={styles.button}
            data-kind={kind}
          >
            {content}
          </a>
        );
      })}
    </aside>
  );
}
