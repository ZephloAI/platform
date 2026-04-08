import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PlatformContent from "@/components/pages/PlatformContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Platform — Zephlo",
  description: "See how Zephlo's AI agent platform works: define tools, deploy the widget, and let AI execute actions directly in the browser.",
};

export default function PlatformPage() {
  return (
    <>
      <Navbar />
      <main>
        <PlatformContent />
      </main>
      <Footer />
    </>
  );
}
