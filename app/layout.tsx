import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0f2a24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Dunia SMA Cahaya Nusantara - 3D & Augmented Reality",
  description:
    "Website sekolah 3D interaktif & Augmented Reality (AR): masuki gerbang sekolah, jelajahi halaman kampus yang luas, masuk gedung, lihat profil, jurusan, ekskul, dan fitur AR kamera.",
  openGraph: {
    title: "Dunia SMA Cahaya Nusantara - 3D & Augmented Reality",
    description:
      "Tur virtual 3D interaktif dan Augmented Reality lingkungan SMA Cahaya Nusantara menggunakan Three.js.",
    type: "website",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏫</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
