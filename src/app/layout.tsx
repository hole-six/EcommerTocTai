import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const miSans = localFont({
  variable: "--font-misans",
  src: [
    { path: "../../public/sites/manmatters-com-61d14dee/shared/fonts/MiSansLatin-Medium.woff2", weight: "300 400", style: "normal" },
    { path: "../../public/sites/manmatters-com-61d14dee/shared/fonts/MiSansLatin-Semibold.woff2", weight: "500 550", style: "normal" },
    { path: "../../public/sites/manmatters-com-61d14dee/shared/fonts/MiSansLatin-Bold.woff2", weight: "600 700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Man Matters: Men's Hair, Skin & Wellness Solutions",
  description: "Science-backed men's hair, beard, skin and nutrition solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${miSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

