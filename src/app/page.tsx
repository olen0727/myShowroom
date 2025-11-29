'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';
import Experience from '@/components/Experience';
import LoadingScreen from '@/components/LoadingScreen';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Force scroll to top on refresh
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    }

    // Simulate loading time for assets and data
    const timer = setTimeout(() => {
      setIsLoading(false);
      window.scrollTo(0, 0); // Ensure top position after loading
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Experience />
      <Contact />
      <Footer />
    </main>
  );
}
