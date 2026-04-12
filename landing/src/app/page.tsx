import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VideoDemo from "@/components/VideoDemo";
import DemoShowcase from "@/components/DemoShowcase";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <VideoDemo />
        <DemoShowcase />
        <CTA />
      </main>
      <Footer />
      <FloatingChat />
    </>
  );
}
