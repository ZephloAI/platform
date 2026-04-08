import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PricingContent from "@/components/pages/PricingContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing — Zephlo",
  description: "Simple, outcome-based pricing. Pay per resolved conversation. No hidden fees, no long contracts.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <PricingContent />
      </main>
      <Footer />
    </>
  );
}
