import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader, Geist_Mono } from "next/font/google";
import Script from "next/script";
import ThemeProvider from "@/components/ThemeProvider";
import ZephloProvider from "@/components/ZephloProvider";
import FloatingChat from "@/components/FloatingChat";
import { siteUrl } from "@/lib/links";
import "./globals.css";

// Only ship weights actually used in the codebase. Audited usage:
// font-medium (500), font-semibold (600), font-bold (700). 400 kept as body default.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Newsreader is only used for serif display headings (font-semibold + italic accents).
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Mono is only used for small code snippets — trim weights.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const title = "Zephlo — Turn your website into an Agent";
const description =
  "Zephlo is the Agent platform for any website. Point us at a URL — we crawl, embed, and ground a conversational Agent in your content, then drop it on your site with one script tag.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Zephlo",
  },
  description,
  applicationName: "Zephlo",
  keywords: [
    "AI agent",
    "website chatbot",
    "RAG",
    "retrieval augmented generation",
    "embeddable agent",
    "conversational AI",
    "AI platform",
    "site search",
    "customer support AI",
  ],
  authors: [{ name: "Zephlo" }],
  creator: "Zephlo",
  publisher: "Zephlo",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title,
    description,
    siteName: "Zephlo",
    url: siteUrl,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@zephlo",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zephlo",
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    sameAs: [
      "https://twitter.com/zephlo",
      "https://linkedin.com/company/zephlo",
      "https://github.com/zephlo",
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zephlo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description,
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${manrope.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <ZephloProvider />
        <ThemeProvider>{children}</ThemeProvider>
        <FloatingChat />
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wmznkc9zt4");`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      </body>
    </html>
  );
}
