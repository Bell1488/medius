import { Phone, Send } from 'lucide-react';
import { trackGoal } from '@/lib/analytics';
import { PHONE_DISPLAY, PHONE_URL, TELEGRAM_URL } from '@/lib/contacts';

export function Footer() {
  return (
    <footer className="bg-[#14213D] py-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B7F34A] text-sm font-black tracking-tighter text-[#14213D]">gc</div>
            <div>
              <p className="text-base font-bold text-white">gelios<span className="text-[#B7F34A]">.cc</span></p>
              <p className="text-xs text-gray-400">ООО «Гелиос»</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <button onClick={() => document.querySelector('#calculator')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-400 hover:text-white transition-colors">Калькулятор</button>
            <button onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-400 hover:text-white transition-colors">Услуги</button>
            <button onClick={() => document.querySelector('#process')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-400 hover:text-white transition-colors">Процесс</button>
            <button onClick={() => document.querySelector('#faq')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</button>
            <button onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-400 hover:text-white transition-colors">Контакты</button>
            <a href={PHONE_URL} onClick={() => trackGoal('phone_click', { source: 'footer' })} className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"><Phone className="w-4 h-4" /> {PHONE_DISPLAY}</a>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'footer' })} className="inline-flex items-center gap-1.5 text-sm text-teal-300 hover:text-white"><Send className="w-4 h-4" /> Telegram</a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            Платёжное сопровождение и организация поставок между Китаем и Россией. © {new Date().getFullYear()} ООО «Гелиос»
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Информация на сайте не является публичной офертой.
          </p>
        </div>
      </div>
    </footer>
  );
}
