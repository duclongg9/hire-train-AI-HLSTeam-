import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireTrain AI",
  description: "AI-Powered HR Recruitment and WebRTC Voice Interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
