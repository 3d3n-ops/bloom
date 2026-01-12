import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bloom - AI-native notebook for students",
  description: "Take notes with AI-powered live transcription",
  icons: {
    icon: "/bloom-logo.svg",
    shortcut: "/bloom-logo.svg",
    apple: "/bloom-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${dmSans.variable} font-sans antialiased`} style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
