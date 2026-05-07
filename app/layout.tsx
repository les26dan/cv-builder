import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: "CV Builder - Resumes That Win Jobs",
  description: "Create ATS-optimized resumes and cover letters with AI. Increase your interview chances by 75%.",
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
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <RootErrorBoundary>
          {children}
        </RootErrorBoundary>
      </body>
    </html>
  );
}
