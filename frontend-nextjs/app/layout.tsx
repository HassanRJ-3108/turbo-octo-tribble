import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foodar - AR Restaurant Menus",
  description: "Transform your restaurant menu with augmented reality 3D experiences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geist.className} antialiased bg-slate-950 text-slate-100`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
