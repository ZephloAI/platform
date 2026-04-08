import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zephlo — Turn Complex Workflows Into Simple Conversations",
  description:
    "AI agent platform that runs tools directly in your users' browsers. No APIs, no OAuth, no credential storage. The browser is the integration layer.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Zephlo — Turn Complex Workflows Into Simple Conversations",
    description:
      "AI agent platform with client-side tool execution. No APIs, no OAuth, no credential storage.",
    siteName: "Zephlo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zephlo — Turn Complex Workflows Into Simple Conversations",
    description:
      "AI agent platform with client-side tool execution. No APIs, no OAuth, no credential storage.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
