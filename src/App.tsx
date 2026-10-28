import { useEffect, useState } from 'react';
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
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      setFormVisible(visible.size > 0);
    }, { rootMargin: '0px 0px 64px 0px' });
    document.querySelectorAll('#calculator, #contact').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

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
      <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Написать в Telegram" tabIndex={formVisible ? -1 : undefined} aria-hidden={formVisible} onClick={() => trackGoal('telegram_click', { source: 'floating_button' })} className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full btn-gradient text-white shadow-lg flex items-center justify-center hover:scale-105 transition-all ${formVisible ? 'invisible pointer-events-none opacity-0' : 'visible opacity-100'}`}>
        <Send className="w-6 h-6" />
      </a>
    </div>
  );
}

export default App;
