import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import OnboardingContent from "@/components/pages/OnboardingContent";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Onboarding — Zephlo",
  description:
    "Conversational onboarding that configures your product directly in users' browsers. No APIs, no OAuth, no credential storage. Activation in the first session.",
  openGraph: {
    title: "Onboarding — Zephlo",
    description:
      "Users describe goals. Zephlo does the rest. Conversational onboarding with client-side tool execution.",
    siteName: "Zephlo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Onboarding — Zephlo",
    description:
      "Users describe goals. Zephlo does the rest. Conversational onboarding with client-side tool execution.",
  },
};

export default function OnboardingPage() {
  return (
    <>
      <Navbar />
      <main>
        <OnboardingContent />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
