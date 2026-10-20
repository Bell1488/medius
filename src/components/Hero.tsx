import { ArrowRight, ShieldCheck, Zap, Clock, TrendingUp, Phone, Send, MessageCircle, type LucideIcon } from 'lucide-react';
import { ExchangeCalculator } from '@/components/ExchangeCalculator';
import { trackGoal } from '@/lib/analytics';
import { PHONE_DISPLAY, PHONE_URL, TELEGRAM_CLIENTS_URL, TELEGRAM_REVIEWS_URL, TELEGRAM_URL } from '@/lib/contacts';

export function Hero() {
  return (
    <section className="relative pt-28 sm:pt-36 pb-10 sm:pb-14 hero-bg overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute top-20 -right-32 w-[28rem] h-[28rem] bg-teal-200/25 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-100/35 rounded-full blur-3xl animate-pulse-glow" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-teal-100 rounded-full mb-6 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span className="text-xs font-semibold text-[#115E59]">Платёжное сопровождение Китай — Россия</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.08] animate-fade-up">
            Платежи в Китай.
            <br />
            <span className="text-gradient">Всё согласовано.</span> До перевода.
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto animate-fade-up delay-200">
            Оплата поставщикам: рубли → юани, пополнение Alipay и WeChat Pay. Работаем с наличными в Москве и Санкт-Петербурге. Рассчитайте платёж прямо сейчас — без звонков и ожидания.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
            <button
              onClick={() => document.querySelector('#calculator')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-7 py-4 text-base font-semibold text-white btn-gradient rounded-xl flex items-center justify-center gap-2.5 group"
            >
              <Zap className="w-5 h-5" />
              Рассчитать обмен
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-7 py-4 text-base font-semibold text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:border-[#0F766E] hover:text-[#0F766E] transition-colors"
            >
              Узнать об услугах
            </button>
            <a
              href={TELEGRAM_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('telegram_reviews_click', { source: 'hero' })}
              className="px-7 py-4 text-base font-semibold text-white bg-[#14213D] rounded-xl flex items-center justify-center gap-2.5 hover:bg-[#115E59] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Наши отзывы
            </a>
          </div>

          <a
            href={TELEGRAM_CLIENTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGoal('telegram_clients_click', { source: 'hero' })}
            className="mx-auto mt-4 inline-flex w-full max-w-md items-center justify-center gap-2.5 rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-6 py-3.5 text-sm font-semibold text-[#0F766E] transition-colors hover:border-[#14B8A6]/50 hover:bg-[#14B8A6]/15 sm:w-auto sm:text-base"
          >
            <MessageCircle className="h-5 w-5" />
            Чат клиентов: живые отзывы и чеки выплат
            <ArrowRight className="h-4 w-4" />
          </a>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'hero' })} className="inline-flex items-center gap-2 text-[#0F766E] font-semibold hover:underline"><Send className="w-4 h-4" /> Telegram</a>
            <a href={PHONE_URL} onClick={() => trackGoal('phone_click', { source: 'hero' })} className="inline-flex items-center gap-2 text-gray-600 font-semibold hover:text-[#0F766E]"><Phone className="w-4 h-4" /> {PHONE_DISPLAY}</a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto animate-fade-up delay-400">
            <Stat icon={TrendingUp} value="1,5%" label="Комиссия от" />
            <Stat icon={ShieldCheck} value="100%" label="Согласование до" />
            <Stat icon={Clock} value="24/7" label="Менеджер на связи" />
          </div>
        </div>
      </div>

      <ExchangeCalculator />
    </section>
  );
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="text-center">
      <Icon className="w-5 h-5 text-[#0F766E] mx-auto mb-1.5" strokeWidth={2} />
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
