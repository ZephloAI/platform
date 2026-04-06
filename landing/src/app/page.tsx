import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import UseCases from "@/components/UseCases";
import HowItWorks from "@/components/HowItWorks";
import Comparison from "@/components/Comparison";
import Security from "@/components/Security";

import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <UseCases />
        <HowItWorks />
        <Comparison />
        <Security />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
