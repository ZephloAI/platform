import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import OnboardingHero from "@/components/onboarding/Hero";
import OnboardingProblem from "@/components/onboarding/Problem";
import OnboardingSolution from "@/components/onboarding/Solution";
import OnboardingBenefits from "@/components/onboarding/Benefits";
import OnboardingHowItWorks from "@/components/onboarding/HowItWorks";
import OnboardingComparison from "@/components/onboarding/Comparison";
import OnboardingMetrics from "@/components/onboarding/Metrics";
import Security from "@/components/Security";
import OnboardingSocialProof from "@/components/onboarding/SocialProof";
import OnboardingCTA from "@/components/onboarding/CTA";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Zephlo — AI Onboarding That Executes, Not Explains",
  description:
    "Conversational onboarding that configures your product directly in users' browsers. No APIs, no OAuth, no credential storage. The browser is the integration layer.",
  openGraph: {
    title: "Zephlo — AI Onboarding That Executes, Not Explains",
    description:
      "Users describe goals. Zephlo does the rest. Conversational onboarding with client-side tool execution.",
    siteName: "Zephlo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zephlo — AI Onboarding That Executes, Not Explains",
    description:
      "Users describe goals. Zephlo does the rest. Conversational onboarding with client-side tool execution.",
  },
};

export default function OnboardingPage() {
  return (
    <>
      <Navbar />
      <main>
        <OnboardingHero />
        <OnboardingProblem />
        <OnboardingSolution />
        <OnboardingBenefits />
        <OnboardingHowItWorks />
        <OnboardingComparison />
        <OnboardingMetrics />
        <Security />
        <OnboardingSocialProof />
        <OnboardingCTA />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}