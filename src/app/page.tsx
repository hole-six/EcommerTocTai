import type { Metadata } from "next";
import { SITE_URL, buildSocialMeta } from "@/lib/seo.config";
import { ManMattersHome } from "@/components/sites/manmatters-com-61d14dee/root-8a5edab2/ManMattersHome";
import { connectDb } from "@/lib/server/db";
import { Banner } from "@/models/Banner";

const pageDescription =
  "CareWise tự hào phân phối các dòng thuốc mọc tóc chính hãng, giải pháp chống rụng tóc và trị hói đầu chuẩn y khoa hàng đầu dành cho nam giới.";

export const metadata: Metadata = {
  description: pageDescription,
  alternates: {
    canonical: SITE_URL,
  },
  keywords: ["thuốc mọc tóc chính hãng", "trị hói đầu", "thuốc mọc tóc", "chăm sóc tóc", "rụng tóc", "mọc tóc", "carewise", "tóc nam", "hói đầu"],
  ...buildSocialMeta({
    title: "CareWise | Thuốc mọc tóc chính hãng & Giải pháp trị hói",
    description: pageDescription,
    url: SITE_URL,
    type: "website",
  }),
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
