import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Probleme from "@/components/landing/Probleme";
import Solution from "@/components/landing/Solution";
import Comment from "@/components/landing/Comment";
import Demo from "@/components/landing/Demo";
import Benefices from "@/components/landing/Benefices";
import Pricing from "@/components/landing/Pricing";
import Temoignages from "@/components/landing/Temoignages";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Probleme />
      <Solution />
      <Comment />
      <Demo />
      <Benefices />
      <Pricing />
      <Temoignages />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
};

export default Index;
