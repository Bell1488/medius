import { useEffect, useState } from 'react';
import { Menu, X, Phone, Send } from 'lucide-react';
import { trackGoal } from '@/lib/analytics';
import { PHONE_DISPLAY, PHONE_URL, TELEGRAM_URL } from '@/lib/contacts';

const navLinks = [
  { href: '#calculator', label: 'Калькулятор' },
  { href: '#services', label: 'Услуги' },
  { href: '#process', label: 'Как это работает' },
  { href: '#faq', label: 'Вопросы' },
  { href: '#contact', label: 'Контакты' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#F6F4EE]/90 backdrop-blur-xl shadow-[0_1px_16px_rgba(20,33,61,0.08)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14213D] text-sm font-black tracking-tighter text-[#B7F34A]">ox</div>
          <span className="text-lg font-bold tracking-tight text-[#14213D]">obmenex<span className="text-[#0F766E]">.pro</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0F766E] transition-colors rounded-lg hover:bg-[#E5F3EE]"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('#calculator')}
            className="ml-3 px-5 py-2.5 text-sm font-semibold text-white btn-gradient rounded-xl"
          >
            Начать обмен
          </button>
          <a href={PHONE_URL} onClick={() => trackGoal('phone_click', { source: 'header_desktop' })} className="ml-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#0F766E]"><Phone className="w-4 h-4" /> {PHONE_DISPLAY}</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'header_desktop' })} className="ml-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline"><Send className="w-4 h-4" /> Telegram</a>
        </nav>

        <button
          className="md:hidden w-10 h-10 flex items-center justify-center text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-white/95 backdrop-blur-xl ${
          mobileOpen ? 'max-h-96 border-b border-gray-100' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col px-5 py-3">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="py-3 text-left text-base font-medium text-gray-700 hover:text-[#0F766E] transition-colors border-b border-gray-50 last:border-0"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('#calculator')}
            className="mt-3 mb-2 px-5 py-3 text-base font-semibold text-white btn-gradient rounded-xl"
          >
            Начать обмен
          </button>
          <div className="flex flex-col gap-3 pt-3">
            <a href={PHONE_URL} onClick={() => trackGoal('phone_click', { source: 'header_mobile' })} className="inline-flex items-center gap-2 text-base font-semibold text-gray-700"><Phone className="w-4 h-4" /> {PHONE_DISPLAY}</a>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'header_mobile' })} className="inline-flex items-center gap-2 text-base font-semibold text-[#0F766E]"><Send className="w-4 h-4" /> Telegram</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
