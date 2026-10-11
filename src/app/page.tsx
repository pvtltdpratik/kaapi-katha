"use client";

import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import Header from "@/components/Header";
import HeroCanvas from "@/components/HeroCanvas";
import CupStage from "@/components/CupStage";
import CoffeeStory from "@/components/CoffeeStory";
import MenuGrid from "@/components/MenuGrid";
import DrinkCustomizer from "@/components/DrinkCustomizer";
import GallerySection from "@/components/GallerySection";
import Rituals from "@/components/Rituals";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ToastContainer from "@/components/ToastContainer";

export default function Home() {
  useSmoothScroll();

  return (
    <main>
      <Header />
      <CupStage />
      <HeroCanvas />
      <CoffeeStory />
      <MenuGrid />
      <DrinkCustomizer />
      <GallerySection />
      <Rituals />
      <AboutSection />
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </main>
  );
}
