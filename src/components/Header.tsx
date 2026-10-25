import { useEffect, useState } from 'react';
import { Menu, X, Phone, Send } from 'lucide-react';
import { trackGoal } from '@/lib/analytics';
import { PHONE_DISPLAY, PHONE_URL, TELEGRAM_URL } from '@/lib/contacts';

const navLinks = [
  { href: '#about', label: 'О нас' },
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
          ? 'bg-[#F4F7FB]/92 backdrop-blur-xl shadow-[0_1px_18px_rgba(16,27,54,0.10)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#101B36] text-sm font-black tracking-tighter text-[#26B6D4]">MO</div>
          <span className="text-lg font-bold tracking-tight text-[#101B36]">MediusObmen<span className="text-[#F2764B]">.cc</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#2457D6] transition-colors rounded-lg hover:bg-[#E8F1FF]"
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
          <a href={PHONE_URL} onClick={() => trackGoal('phone_click', { source: 'header_desktop' })} className="ml-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#2457D6]"><Phone className="w-4 h-4" /> {PHONE_DISPLAY}</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'header_desktop' })} className="ml-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2457D6] hover:underline"><Send className="w-4 h-4" /> Telegram</a>
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
              className="py-3 text-left text-base font-medium text-gray-700 hover:text-[#2457D6] transition-colors border-b border-gray-50 last:border-0"
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
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'header_mobile' })} className="inline-flex items-center gap-2 text-base font-semibold text-[#2457D6]"><Send className="w-4 h-4" /> Telegram</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
