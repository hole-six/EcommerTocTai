import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thuốc Mọc Tóc Chính Hãng",
    short_name: "Thuốc Mọc Tóc",
    description:
      "Hệ thống phân phối thuốc mọc tóc chính hãng, giải pháp trị hói đầu và chăm sóc da đầu an toàn hiệu quả.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#143461",
    orientation: "portrait",
    categories: ["shopping", "health", "lifestyle"],
    icons: [
      {
        src: "/icons/carewise-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/carewise-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/carewise-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
