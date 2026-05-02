import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SecurityContent from "@/components/pages/SecurityContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Security — Zephlo",
  description:
    "Conversations stored safely and encrypted. Role-based access control. SOC 2, GDPR, and HIPAA compliance work underway.",
  openGraph: {
    title: "Security — Zephlo",
    description:
      "Encrypted conversations, role-based access control, and an open compliance roadmap (SOC 2, GDPR, HIPAA).",
    siteName: "Zephlo",
    type: "website",
  },
};

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main>
        <SecurityContent />
      </main>
      <Footer />
    </>
  );
}
