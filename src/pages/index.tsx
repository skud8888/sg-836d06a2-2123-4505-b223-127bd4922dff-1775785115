import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <>
      <SEO 
        title="TrainHub - Modern Training Management Platform"
        description="Transform learning with our all-in-one training management platform. Streamline courses, enrollment, and progress tracking."
      />
      <Navigation />
      <main className="min-h-screen bg-background">
        <Hero />
        <Features />
      </main>
    </>
  );
}