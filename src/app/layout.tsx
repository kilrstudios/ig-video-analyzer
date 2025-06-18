import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import AuthRedirectHandler from '@/components/AuthRedirectHandler';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instagram Video Analyzer",
  description: "AI-powered Instagram video content analysis with strategic insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.stripe.com/v3/" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <AuthRedirectHandler />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
