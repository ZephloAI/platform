import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExamplesIndex from "@/components/examples/ExamplesIndex";

export const metadata: Metadata = {
  title: "Examples — Zephlo",
  description:
    "Live examples of Agents built on Zephlo — documentation, support, e-commerce, onboarding, internal knowledge, and marketing. Try a demo or use any as a template.",
  openGraph: {
    title: "Zephlo Examples — Agents that actually do things",
    description:
      "Live, interactive examples of Agents you can deploy to your own site.",
    type: "website",
  },
};

export default function ExamplesPage() {
  return (
    <>
      <Navbar />
      <main>
        <ExamplesIndex />
      </main>
      <Footer />
    </>
  );
}
