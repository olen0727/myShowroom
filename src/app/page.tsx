import Hero from '@/components/Hero';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';
import Experience from '@/components/Experience';

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Projects />
      <Experience />
      <Contact />
    </main>
  );
}
