import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { CartProvider } from "@/contexts/CartContext";
import { CartToastHost } from "@/components/cart/CartToast";
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
    template: `%s | Thuốc mọc tóc chính hãng CareWise`,
    default: "CareWise | Thuốc mọc tóc chính hãng & Giải pháp trị hói",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["thuốc mọc tóc chính hãng", "trị hói đầu", "thuốc mọc tóc", "chăm sóc tóc", "rụng tóc", "mọc tóc", "carewise", "tóc nam", "hói đầu"],
  authors: [{ name: "CareWise Team" }],
  creator: "CareWise",
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
    title: "CareWise | Thuốc mọc tóc chính hãng & Giải pháp trị hói",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
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
    title: "CareWise | Thuốc mọc tóc chính hãng & Giải pháp trị hói",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
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
          <CartToastHost />
          <ContactButtons />
          <SupportChatWidget />
          <PwaRegister />
        </CartProvider>
      </body>
    </html>
  );
}
