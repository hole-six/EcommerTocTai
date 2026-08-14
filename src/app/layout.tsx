import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { CartProvider } from "@/contexts/CartContext";
import { ToastHost } from "@/components/ui/Toast";
import { PwaRegister } from "@/components/PwaRegister";
import { ContactButtons } from "@/components/support/ContactButtons";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, PUBLISHER } from "@/lib/seo.config";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
});



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    template: `%s | Thuốc Mọc Tóc Chính Hãng`,
    default: "Thuốc Mọc Tóc Chính Hãng | Giải pháp trị hói & phục hồi tóc",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["thuốc mọc tóc chính hãng", "trị hói đầu", "thuốc mọc tóc", "chăm sóc tóc", "rụng tóc", "mọc tóc", "tóc nam", "hói đầu"],
  authors: [{ name: "Thuốc Mọc Tóc Chính Hãng" }],
  creator: "Thuốc Mọc Tóc Chính Hãng",
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Thuốc Mọc Tóc Chính Hãng | Giải pháp trị hói & phục hồi tóc",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Thuốc Mọc Tóc Chính Hãng",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thuốc Mọc Tóc Chính Hãng | Giải pháp trị hói & phục hồi tóc",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
    creator: "@thuocmoctoc",
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
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: PUBLISHER.logo,
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Vietnamese",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/shop/all?q={search_term_string}`,
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
          <ToastHost />
          <ContactButtons />
          <SupportChatWidget />
          <PwaRegister />
        </CartProvider>
      </body>
    </html>
  );
}
