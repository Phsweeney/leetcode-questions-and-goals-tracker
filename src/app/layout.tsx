import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeetTrack",
  description: "Local tracker for completed programming problems",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
