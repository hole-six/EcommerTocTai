import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CareWise",
    short_name: "CareWise",
    description:
      "CareWise - chăm sóc tóc và da đầu với routine phù hợp cho nam giới.",
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
