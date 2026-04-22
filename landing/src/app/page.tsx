import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import DemoShowcase from "@/components/DemoShowcase";
import SocialProof from "@/components/SocialProof";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";

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
      <FloatingChat />
    </>
  );
}
