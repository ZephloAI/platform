import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExampleDetail from "@/components/examples/ExampleDetail";
import { examples, getExample } from "@/components/examples/examplesData";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return examples.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) return { title: "Example not found — Zephlo" };
  return {
    title: `${ex.title} — Zephlo Examples`,
    description: ex.description,
    openGraph: {
      title: `${ex.title} — Zephlo`,
      description: ex.description,
      type: "article",
    },
  };
}

export default async function ExampleSlugPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const ex = getExample(slug);
  if (!ex) notFound();

  return (
    <>
      <Navbar />
      <main>
        <ExampleDetail example={ex} />
      </main>
      <Footer />
    </>
  );
}
