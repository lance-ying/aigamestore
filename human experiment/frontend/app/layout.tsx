import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Rating Study",
  description: "Rate and evaluate games",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
