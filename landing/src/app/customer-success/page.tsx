import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import CustomerSuccessContent from "@/components/pages/CustomerSuccessContent";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Customer Success — Zephlo",
  description:
    "No more dedicated agents answering “how do I do X?” or “where is X?”. Zephlo Agents use client-side tools to take action for users — instantly, in-product.",
  openGraph: {
    title: "Customer Success — Zephlo",
    description:
      "Replace repetitive how-to questions with an Agent that just does it. Client-side tools, easy setup, real customer outcomes.",
    siteName: "Zephlo",
    type: "website",
  },
};

export default function CustomerSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="theme-success">
        <CustomerSuccessContent />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
