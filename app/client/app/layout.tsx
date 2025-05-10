import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Republic",
  description: "Trade Republic",
  generator: "Trade Republic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
