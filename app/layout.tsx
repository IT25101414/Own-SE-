import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupplyLens — Software Supply Chain Security",
  description:
    "Monitor dependency risk, investigate vulnerabilities, and enforce software supply-chain policies.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
