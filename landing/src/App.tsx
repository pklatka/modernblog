import { InteractiveBackground } from './components/InteractiveBackground';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen">
      <InteractiveBackground />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
