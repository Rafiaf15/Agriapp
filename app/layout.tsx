import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME} - App`,
  description: `${process.env.NEXT_PUBLIC_APP_DESCRIPTION}`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
