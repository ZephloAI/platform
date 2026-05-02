import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LeadGenerationContent from "@/components/pages/LeadGenerationContent";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Lead Generation — Zephlo",
  description:
    "Capture every lead with timely, 24/7 responses. Zephlo Agents reply in seconds, qualify visitors, and book meetings — even after working hours.",
  openGraph: {
    title: "Lead Generation — Zephlo",
    description:
      "Capture every lead with timely, 24/7 responses. Reply in seconds, qualify in conversation, and book meetings around the clock.",
    siteName: "Zephlo",
    type: "website",
  },
};

export default function LeadGenerationPage() {
  return (
    <>
      <Navbar />
      <main>
        <LeadGenerationContent />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
