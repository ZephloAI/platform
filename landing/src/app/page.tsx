import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

// Below-fold sections render server-side (so SSR HTML is complete) but their
// hydration JS loads in separate chunks, deferred from the critical path.
const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const UseCases = dynamic(() => import("@/components/UseCases"));
const DemoShowcase = dynamic(() => import("@/components/DemoShowcase"));
const SocialProof = dynamic(() => import("@/components/SocialProof"));
const Pricing = dynamic(() => import("@/components/Pricing"));
const CTA = dynamic(() => import("@/components/CTA"));
const Footer = dynamic(() => import("@/components/Footer"));

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <DemoShowcase />
        <SocialProof />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
