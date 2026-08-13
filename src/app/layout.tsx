import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { CartProvider } from "@/contexts/CartContext";
import { CartToastHost } from "@/components/cart/CartToast";
import { PwaRegister } from "@/components/PwaRegister";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
});

const siteUrl = "https://moctoc.vn";
const siteName = "CareWise";
const siteDescription =
  "Giải pháp chăm sóc tóc và da đầu được chọn lọc cho routine riêng của bạn — sản phẩm chính hãng, tư vấn theo từng giai đoạn, giao hàng toàn quốc.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    template: `%s | ${siteName}`,
    default: "CareWise | Chăm sóc tóc từ sự thấu hiểu",
  },
  description: siteDescription,
  keywords: ["chăm sóc tóc", "rụng tóc", "mọc tóc", "trị gàu", "dưỡng tóc", "carewise", "tóc nam", "hói đầu"],
  authors: [{ name: "CareWise Team" }],
  creator: "CareWise",
  publisher: "CareWise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "CareWise | Chăm sóc tóc từ sự thấu hiểu",
    description: siteDescription,
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: "/images/toc-tai-hero.png",
        width: 1200,
        height: 630,
        alt: "CareWise - Chăm sóc tóc",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareWise | Chăm sóc tóc",
    description: siteDescription,
    images: ["/images/toc-tai-hero.png"],
    creator: "@carewise",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/images/logocarewise-trimmed.png`,
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/shop/all?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const viewport: Viewport = {
  themeColor: "#143461",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${lexend.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <CartProvider>
          {children}
          <CartToastHost />
          <SupportChatWidget />
          <PwaRegister />
        </CartProvider>
      </body>
    </html>
  );
}
