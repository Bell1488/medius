import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Services } from '@/components/Services';
import { Conditions } from '@/components/Conditions';
import { Process } from '@/components/Process';
import { Pricing } from '@/components/Pricing';
import { Faq } from '@/components/Faq';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { Send } from 'lucide-react';
import { trackGoal } from '@/lib/analytics';
import { TELEGRAM_URL } from '@/lib/contacts';

function App() {
  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Conditions />
        <Process />
        <Pricing />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Написать в Telegram" onClick={() => trackGoal('telegram_click', { source: 'floating_button' })} className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full btn-gradient text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
        <Send className="w-6 h-6" />
      </a>
    </div>
  );
}

export default App;
