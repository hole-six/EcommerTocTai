import type { Metadata } from "next";
import { ManMattersHome } from "@/components/sites/manmatters-com-61d14dee/root-8a5edab2/ManMattersHome";
import { connectDb } from "@/lib/server/db";
import { Banner } from "@/models/Banner";

export const metadata: Metadata = {
  description:
    "Khám phá giải pháp chăm sóc tóc và da đầu chuyên sâu. Sản phẩm chống rụng tóc, kích mọc tóc chuẩn y khoa dành cho bạn.",
};

async function getInitialBanners(placement: "home_hero" | "home_promo") {
  try {
    await connectDb();
    const banners = await Banner.find({ placement, isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("image alt ctaLabel ctaHref")
      .lean();
    return banners.map((banner) => ({
      image: banner.image,
      alt: banner.alt,
      cta: banner.ctaLabel,
      href: banner.ctaHref || "/shop/all",
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const [initialBanners, initialPromoBanners] = await Promise.all([
    getInitialBanners("home_hero"),
    getInitialBanners("home_promo"),
  ]);
  return (
    <ManMattersHome
      initialBanners={initialBanners}
      initialPromoBanners={initialPromoBanners}
    />
  );
}
