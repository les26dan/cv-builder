import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  fallback: ['Monaco', 'monospace'],
});

export const metadata: Metadata = {
  title: "OkBuddy - CV & Thư xin việc tự động",
  description: "Tối ưu CV và tạo thư xin việc nhanh chóng với AI. Tăng 75% cơ hội phỏng vấn.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Global error boundary for navigation issues
function RootErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div suppressHydrationWarning={true}>
      {children}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <RootErrorBoundary>
          {children}
        </RootErrorBoundary>
      </body>
    </html>
  );
}
