import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/retro.css";
import CrtToggle from "@/components/CrtToggle";

export const metadata: Metadata = {
  metadataBase: new URL("https://tools.aaenz.no"),
  title: {
    default: "tools · aaenz",
    template: "%s · tools · aaenz",
  },
  applicationName: "tools · aaenz",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "tools · aaenz",
    siteName: "tools · aaenz",
  },
  twitter: {
    card: "summary",
    title: "tools · aaenz",
  },
};

const nostrutaru = localFont({
  src: "../public/fonts/Nosutaru-dotMPlusH-10-Regular.ttf",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className={`${nostrutaru.className} min-h-full flex flex-col`}>
        <CrtToggle />
        <div className="crt-overlay" aria-hidden="true" />
        <div className="crt-content flex-1">{children}</div>
      </body>
    </html>
  );
}
