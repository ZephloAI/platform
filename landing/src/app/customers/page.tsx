import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import CustomersContent from "@/components/pages/CustomersContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Customers — Zephlo",
  description: "See how teams use Zephlo to turn complex workflows into simple conversations with AI agents that execute in the browser.",
};

export default function CustomersPage() {
  return (
    <>
      <Navbar />
      <main>
        <CustomersContent />
      </main>
      <Footer />
    </>
  );
}
