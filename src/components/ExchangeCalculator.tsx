import { useState, useMemo, useEffect } from 'react';
import { ArrowLeftRight, Info, TrendingUp, Send, UserRound, LineChart, LockKeyhole, FileCheck2, ShieldCheck, Timer, Clock3 } from 'lucide-react';
import {
  type Currency,
  type RateTable,
  RATES,
  getRate,
  formatNumber,
} from '@/types';
import { trackGoal } from '@/lib/analytics';
import { TELEGRAM_URL } from '@/lib/contacts';

const CURRENCIES: Currency[] = ['RUB', 'CNY', 'USD'];
const BANK_CNY_RUB_RATE = 13.05;
const CUSTOMER_BANK_ADVANTAGE = 0.03;

export function ExchangeCalculator() {
  const [fromCurrency, setFromCurrency] = useState<Currency>('RUB');
  const [toCurrency, setToCurrency] = useState<Currency>('CNY');
  const [fromAmount, setFromAmount] = useState<string>('100000');
  const [method, setMethod] = useState<string>('invoice');
  const [rates, setRates] = useState<RateTable>(RATES);
  const [lockSeconds, setLockSeconds] = useState(15 * 60);
  const [noticeIndex, setNoticeIndex] = useState(0);

  const paymentNotices = [
    'Только что: оплачен инвойс фабрики на 42 000 ¥',
    '2 мин назад: пополнение Alipay на 8 500 ¥ через СБП',
    '5 мин назад: зафиксирован курс на 180 000 ₽',
    '7 мин назад: перевод поставщику на 25 000 ¥',
    '10 мин назад: пополнение WeChat Pay на 12 000 ¥',
    '14 мин назад: заявка на оплату инвойса 96 000 ₽',
    '18 мин назад: курс зафиксирован для закупки в Иу',
  ];

  useEffect(() => {
    let active = true;

    const loadRates = async () => {
      try {
        const response = await fetch('/api/rates', { cache: 'no-store' });
        if (!response.ok) throw new Error('Rates API unavailable');
        const data = await response.json() as { rates?: RateTable; officialRubRates?: RateTable; updatedAt?: string };
        if (!data.rates || !active) return;
        setRates(data.rates);
      } catch {
        // Keep the bundled fallback rates when the CBR endpoint is unavailable.
      }
    };

    void loadRates();
    const timer = window.setInterval(loadRates, 60 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setLockSeconds((seconds) => (seconds > 0 ? seconds - 1 : 15 * 60)), 1000);
    const noticeTimer = window.setInterval(() => setNoticeIndex((index) => (index + 1) % paymentNotices.length), 20000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(noticeTimer);
    };
  }, [paymentNotices.length]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const rate = useMemo(() => getRate(fromCurrency, toCurrency, rates), [fromCurrency, toCurrency, rates]);
  const customerRate = useMemo(() => {
    if (fromCurrency === 'RUB' && toCurrency === 'CNY') return (1 / BANK_CNY_RUB_RATE) * (1 + CUSTOMER_BANK_ADVANTAGE);
    if (fromCurrency === 'CNY' && toCurrency === 'RUB') return BANK_CNY_RUB_RATE * (1 + CUSTOMER_BANK_ADVANTAGE);
    return rate;
  }, [fromCurrency, toCurrency, rate]);
  const displayedRate = useMemo(() => {
    if (fromCurrency === 'RUB' && toCurrency === 'CNY') {
      return { from: 'CNY' as Currency, to: 'RUB' as Currency, value: 1 / customerRate };
    }
    return { from: fromCurrency, to: toCurrency, value: customerRate };
  }, [fromCurrency, toCurrency, customerRate]);

  const calculated = useMemo(() => {
    const amount = parseFloat(fromAmount) || 0;
    const baseResult = amount * customerRate;
    const commissionPercent =
      method === 'invoice' ? 1.5 :
      method === 'alipay' ? 1.8 :
      method === 'wechat' ? 1.6 : 2.0;
    const commissionAmount = baseResult * (commissionPercent / 100);
    const toAmount = baseResult - commissionAmount;
    return { toAmount, commissionPercent, commissionAmount, total: baseResult };
  }, [fromAmount, customerRate, method]);

  const marketRate = useMemo(() => {
    if (fromCurrency === 'RUB' && toCurrency === 'CNY') return 1 / BANK_CNY_RUB_RATE;
    if (fromCurrency === 'CNY' && toCurrency === 'RUB') return BANK_CNY_RUB_RATE;
    return rate;
  }, [fromCurrency, toCurrency, rate]);

  const marketResult = useMemo(() => {
    const amount = parseFloat(fromAmount) || 0;
    return amount * marketRate;
  }, [fromAmount, marketRate]);

  const savingsPercent = marketResult > 0 ? Math.max(0, ((calculated.toAmount - marketResult) / marketResult) * 100) : 0;
  const savingsAmount = Math.max(0, calculated.toAmount - marketResult);
  const lockTime = `${String(Math.floor(lockSeconds / 60)).padStart(2, '0')}:${String(lockSeconds % 60).padStart(2, '0')}`;
  const cnyAmount = fromCurrency === 'CNY' ? Number(fromAmount) : calculated.toAmount;
  const showMinimumWarning = toCurrency === 'CNY' && Number.isFinite(cnyAmount) && cnyAmount > 0 && cnyAmount < 500;

  const presetAmounts = [50000, 100000, 250000];

  return (
    <div id="calculator" className="relative py-10 sm:py-14 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="calc-card rounded-3xl p-6 sm:p-8 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0052CC]">
              <TrendingUp className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Калькулятор обмена</h2>
              <p className="text-sm text-gray-400">Рассчитайте платёж за секунду</p>
            </div>
          </div>

          {showMinimumWarning && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Минимальная сумма заявки — <strong>500 CNY</strong>.</span>
            </div>
          )}

          <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-2">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Отдаю</label>
              <div className="relative">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0"
                  className="input-field w-full pl-4 pr-16 py-4 rounded-xl text-2xl font-bold text-gray-900"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <CurrencySelector value={fromCurrency} onChange={setFromCurrency} />
                </div>
              </div>
              {fromCurrency === 'RUB' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFromAmount(String(amount))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        Number(fromAmount) === amount
                          ? 'bg-blue-100 text-[#0052CC]'
                          : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-[#0052CC]'
                      }`}
                    >
                      {formatNumber(amount)} ₽
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={swapCurrencies}
              className="mt-8 h-11 w-11 self-start rounded-xl bg-blue-50 text-[#0052CC] transition-all hover:scale-110 hover:bg-blue-100 active:scale-95 sm:mt-8"
              aria-label="Поменять валюты"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Получаю</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={formatNumber(calculated.toAmount)}
                  className="input-field w-full pl-4 pr-16 py-4 rounded-xl text-2xl font-bold text-[#0052CC] bg-blue-50/30"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <CurrencySelector value={toCurrency} onChange={setToCurrency} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-[#003D99]">
            <Timer className="mt-0.5 h-4 w-4 shrink-0 text-[#0052CC]" />
            <p>
              <span className="font-semibold">Курс {formatNumber(displayedRate.value)} ₽ зафиксирован на {lockTime} мин.</span>{' '}
              После истечения расчёт обновится.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
              <span className="inline-flex items-center gap-2"><LineChart className="h-4 w-4" /> Выгоднее банковского курса</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Выгоднее на ~{formatNumber(savingsPercent)}%</span>
            </div>
            <p className="mt-3 border-t border-emerald-200/80 pt-3 text-sm text-emerald-800/80">Экономия до {formatNumber(savingsAmount)} {toCurrency} по сравнению с банком.</p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 text-sm">
            <div className="grid grid-cols-4 bg-gray-100 px-3 py-2 font-semibold text-gray-600">
              <span>Способ</span><span>Курс</span><span>Комиссия</span><span>Срок</span>
            </div>
            <div className="grid grid-cols-4 border-t border-gray-200 px-3 py-2 text-gray-600">
              <span>Крупные банки</span><span>{formatNumber(BANK_CNY_RUB_RATE)} ₽</span><span>от 3%</span><span>3–14 дней</span>
            </div>
            <div className="grid grid-cols-4 border-t border-gray-200 px-3 py-2 font-semibold text-gray-900">
              <span>Наш сервис</span><span>{formatNumber(displayedRate.value)} ₽</span><span>на 3% выгоднее</span><span>15–60 минут</span>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Способ оплаты</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'invoice', label: 'Инвойс' },
                { key: 'alipay', label: 'Alipay' },
                { key: 'wechat', label: 'WeChat' },
                { key: 'card', label: 'Карта' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    method === m.key
                      ? 'btn-gradient text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Предварительный расчёт. Финальные условия подтвердит менеджер после проверки реквизитов.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a href={`${TELEGRAM_URL}?text=${encodeURIComponent(`Здравствуйте! Расчёт: ${formatNumber(parseFloat(fromAmount) || 0)} ${fromCurrency} → ${formatNumber(calculated.toAmount)} ${toCurrency}, курс ${formatNumber(rate)}, комиссия ${calculated.commissionPercent}%`)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'calculator' })} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white btn-gradient"><Send className="h-4 w-4" />Зафиксировать курс в Telegram</a>
            <button type="button" onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-[#0052CC] hover:bg-blue-100"><UserRound className="h-4 w-4" />Оставить заявку</button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-emerald-600" /> Данные защищены</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Пароли не передаём</span>
            <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5 text-emerald-600" /> Чек и подтверждение в PDF</span>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white/80 p-4 text-sm text-gray-700 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-gray-900"><Clock3 className="h-4 w-4 text-[#0052CC]" /> Последние успешные операции</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {paymentNotices.slice(0, 4).map((notice, index) => (
              <p key={notice} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${index === noticeIndex % 4 ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50'}`}>
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />{notice}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrencySelector({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
      className="appearance-none bg-white border-2 border-gray-200 rounded-lg pl-2.5 pr-1 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#0052CC] cursor-pointer"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
