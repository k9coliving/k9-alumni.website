import type { Metadata } from "next";
import { Geist, Geist_Mono, Parisienne, Baloo_2, Nunito, Caveat } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { isAuthenticated } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: "400",
});

// Newsletter design fonts ("The Nest" layout)
const baloo2 = Baloo_2({
  variable: "--font-baloo2",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "K9 Alumni Website",
  description: "Whether you've been a K9er for a few months or many years, moving out is never easy. We are on a journey to build a strong alumni network, so the K9 magic lives on, outside the walls of the house.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${parisienne.variable} ${baloo2.variable} ${nunito.variable} ${caveat.variable} antialiased`}
      >
        <AuthProvider initialAuth={authenticated}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
