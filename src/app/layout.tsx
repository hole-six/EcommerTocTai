import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { CartProvider } from "@/contexts/CartContext";
import { PwaRegister } from "@/components/PwaRegister";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  applicationName: "CareWise",
  title: "CareWise | Chăm sóc tóc từ sự thấu hiểu",
  description:
    "Giải pháp chăm sóc tóc và da đầu được chọn lọc cho routine riêng của bạn.",
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
    title: "CareWise",
    statusBarStyle: "default",
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
        <CartProvider>
          {children}
          <SupportChatWidget />
          <PwaRegister />
        </CartProvider>
      </body>
    </html>
  );
}
