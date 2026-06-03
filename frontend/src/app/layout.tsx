import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireTrain AI — Intelligent Recruitment Platform",
  description: "AI-Powered HR Recruitment with AWS AI Services & WebRTC Voice Interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
