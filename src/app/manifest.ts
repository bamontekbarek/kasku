import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kasku",
    short_name: "Kasku",
    description: "Catat pengeluaran lebih cepat — cukup foto struknya.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0B0E11",
    theme_color: "#0B0E11",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
