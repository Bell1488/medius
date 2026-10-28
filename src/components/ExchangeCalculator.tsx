import { useState, useMemo, useEffect, useRef, type FormEvent } from 'react';
import { ArrowLeftRight, CheckCircle2, ChevronDown, Info, LoaderCircle, LockKeyhole, Send, TrendingUp } from 'lucide-react';
import { type Currency, type RateTable, COMMISSIONS, CURRENCY_SYMBOLS, METHOD_LABELS, RATES, getRate, formatNumber } from '@/types';
import { trackGoal } from '@/lib/analytics';
import { sendLead } from '@/lib/leads';

const CURRENCIES: Currency[] = ['RUB', 'CNY', 'USD'];
const BANK_CNY_RUB_RATE = 13.05;
const CUSTOMER_CNY_RUB_RATE = 12.33;
const MIN_AMOUNT_CNY = 500;
const METHODS = [
  { key: 'invoice', label: 'Инвойс' },
  { key: 'alipay', label: 'Alipay' },
  { key: 'wechat', label: 'WeChat' },
  { key: 'card', label: 'Карта' },
];

export function ExchangeCalculator() {
  const [fromCurrency, setFromCurrency] = useState<Currency>('RUB');
  const [toCurrency, setToCurrency] = useState<Currency>('CNY');
  const [fromAmount, setFromAmount] = useState('100000');
  const [method, setMethod] = useState('invoice');
  const [rates, setRates] = useState<RateTable>(RATES);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      try {
        const response = await fetch('/api/rates', { cache: 'no-store' });
        if (!response.ok) throw new Error('Rates API unavailable');
        const data = await response.json() as { rates?: RateTable };
        if (data.rates && active) setRates(data.rates);
      } catch {
        // Keep bundled rates if the API is unavailable.
      }
    };
    void loadRates();
    const timer = window.setInterval(loadRates, 60 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };
  const changeFromCurrency = (currency: Currency) => {
    if (currency === toCurrency) setToCurrency(fromCurrency);
    setFromCurrency(currency);
  };
  const changeToCurrency = (currency: Currency) => {
    if (currency === fromCurrency) setFromCurrency(toCurrency);
    setToCurrency(currency);
  };

  const customerRate = useMemo(() => {
    if (fromCurrency === 'RUB' && toCurrency === 'CNY') return 1 / CUSTOMER_CNY_RUB_RATE;
    if (fromCurrency === 'CNY' && toCurrency === 'RUB') return CUSTOMER_CNY_RUB_RATE;
    return getRate(fromCurrency, toCurrency, rates);
  }, [fromCurrency, toCurrency, rates]);
  const displayedRate = fromCurrency === 'RUB' && toCurrency === 'CNY'
    ? { from: toCurrency, to: fromCurrency, value: 1 / customerRate }
    : { from: fromCurrency, to: toCurrency, value: customerRate };
  const amount = Number(fromAmount);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const commissionPercent = COMMISSIONS[method];
  const baseResult = validAmount ? amount * customerRate : 0;
  const commissionAmount = baseResult * commissionPercent / 100;
  const toAmount = baseResult - commissionAmount;
  const marketRate = fromCurrency === 'RUB' && toCurrency === 'CNY'
    ? 1 / BANK_CNY_RUB_RATE
    : fromCurrency === 'CNY' && toCurrency === 'RUB'
      ? BANK_CNY_RUB_RATE
      : getRate(fromCurrency, toCurrency, rates);
  const marketResult = validAmount ? amount * marketRate : 0;
  const savingsPercent = marketResult > 0 ? Math.max(0, (toAmount / marketResult - 1) * 100) : 0;
  const bankDisplayedRate = fromCurrency === 'RUB' && toCurrency === 'CNY' ? 1 / marketRate : marketRate;
  const cnyAmount = fromCurrency === 'CNY' ? amount
    : toCurrency === 'CNY' ? toAmount
      : amount * getRate(fromCurrency, 'CNY', rates);
  const showMinimumWarning = validAmount && cnyAmount < MIN_AMOUNT_CNY;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || status === 'success') return;
    setErrorMessage('');
    if (!validAmount || !Number.isFinite(toAmount) || !Number.isFinite(cnyAmount) || cnyAmount < MIN_AMOUNT_CNY) {
      setErrorMessage(`Минимальная сумма заявки — ${MIN_AMOUNT_CNY} CNY или эквивалент в выбранной валюте.`);
      setStatus('error');
      return;
    }
    if (!name.trim() || !/^[+\d\s().-]+$/.test(phone) || !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) {
      setErrorMessage('Укажите имя и корректный номер телефона с кодом страны.');
      setStatus('error');
      return;
    }
    if (!consent) return;
    submitting.current = true;
    setStatus('sending');
    try {
      await sendLead({
        name: name.trim(), contact: phone.trim(), amount: String(cnyAmount),
        paymentMethod: METHOD_LABELS[method], consent,
        exchange: {
          fromAmount: amount, fromCurrency, toAmount, toCurrency, rate: customerRate,
          commissionPercent, commissionAmount, method: METHOD_LABELS[method],
        },
      });
      setStatus('success');
      setName('');
      setPhone('');
      setConsent(false);
      trackGoal('lead_submit', { source: 'calculator' });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось отправить заявку. Попробуйте ещё раз.');
      setStatus('error');
    } finally {
      submitting.current = false;
    }
  };

  return (
    <div id="calculator" className="relative min-w-0 scroll-mt-24 py-3 sm:py-5">
      <form onSubmit={handleSubmit} className="calc-card calculator rounded-2xl p-4 animate-scale-in sm:rounded-3xl sm:p-6" aria-labelledby="calculator-title">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2457D6]"><TrendingUp className="h-4 w-4" /></div>
          <div className="min-w-0">
            <h2 id="calculator-title" className="text-lg font-bold text-gray-900 sm:text-xl">Калькулятор обмена</h2>
            <p className="text-xs text-gray-500 sm:text-sm">Рассчитайте платёж и оставьте заявку</p>
          </div>
        </div>
        <fieldset disabled={status === 'sending'} className="min-w-0 space-y-3">
          <legend className="sr-only">Параметры обмена</legend>
          <div className="calculator-amounts">
            <div className="calculator-from min-w-0">
              <label htmlFor="calculator-amount" className="mb-1 block text-xs font-medium text-gray-500">Отдаю</label>
              <div className="calculator-money">
                <input id="calculator-amount" name="fromAmount" type="number" inputMode="decimal" required min="0.01" step="any" value={fromAmount} onChange={(event) => setFromAmount(event.target.value)} placeholder="0" className="min-w-0 w-full bg-transparent py-3 pl-3 pr-1 text-xl font-bold text-gray-900 focus:outline-none" />
                <CurrencySelector label="Валюта отправления" value={fromCurrency} onChange={changeFromCurrency} />
              </div>
            </div>
            <button type="button" onClick={swapCurrencies} className="calculator-swap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2457D6] transition hover:bg-blue-100 active:rotate-180 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" aria-label="Поменять валюты"><ArrowLeftRight className="h-4 w-4" /></button>
            <div className="calculator-to min-w-0">
              <label htmlFor="calculator-result" className="mb-1 block text-xs font-medium text-gray-500">Получаю <span className="text-gray-400">с учётом комиссии</span></label>
              <div className="calculator-money calculator-money-result">
                <input id="calculator-result" type="text" readOnly value={formatNumber(toAmount)} title={`${formatNumber(toAmount)} ${toCurrency}`} className="min-w-0 w-full bg-transparent py-3 pl-3 pr-1 text-xl font-bold text-[#2457D6] focus:outline-none" />
                <CurrencySelector label="Валюта получения" value={toCurrency} onChange={changeToCurrency} />
              </div>
            </div>
          </div>
          {fromCurrency === 'RUB' && (
            <div className="flex flex-wrap gap-1.5">
              {[50000, 100000, 250000].map((preset) => (
                <button key={preset} type="button" onClick={() => setFromAmount(String(preset))} aria-pressed={amount === preset} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition active:scale-95 ${amount === preset ? 'bg-blue-100 text-[#2457D6]' : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-[#2457D6]'}`}>{formatNumber(preset)} ₽</button>
              ))}
            </div>
          )}
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-xs font-medium text-gray-500">Способ оплаты</legend>
            <div className="grid grid-cols-4 gap-1.5">
              {METHODS.map((item) => (
                <button key={item.key} type="button" onClick={() => setMethod(item.key)} aria-pressed={method === item.key} className={`min-w-0 rounded-lg px-1 py-2.5 text-xs font-medium transition active:scale-95 sm:text-sm ${method === item.key ? 'btn-gradient text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-blue-50'}`}>{item.label}</button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>Курс: <strong className="font-medium text-gray-700">1 {displayedRate.from} = {formatNumber(displayedRate.value)} {displayedRate.to}</strong></span>
            <span>Комиссия {formatNumber(commissionPercent)}%</span>
          </div>
          <div className={`calculator-savings flex items-center justify-between gap-1 rounded-lg px-2.5 py-2 font-medium ${savingsPercent > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
            <span>{savingsPercent > 0 ? 'Выгоднее банковского курса' : 'Сравнение с банковским курсом'}</span>
            <span className="shrink-0 font-semibold">{savingsPercent > 0 ? `Выгоднее на ~${formatNumber(savingsPercent)}%` : 'Экономии нет'}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="calculator-comparison w-full table-fixed text-left leading-snug">
              <caption className="sr-only">Сравнение курса, комиссии и сроков с банками</caption>
              <colgroup><col className="w-[27%]" /><col className="w-[23%]" /><col className="w-[23%]" /><col className="w-[27%]" /></colgroup>
              <thead className="bg-gray-50 text-gray-500"><tr><th scope="col">Способ</th><th scope="col">Курс, {CURRENCY_SYMBOLS[displayedRate.to]}</th><th scope="col">Комиссия</th><th scope="col">Срок</th></tr></thead>
              <tbody className="text-gray-600">
                <tr className="border-t border-gray-100"><th scope="row" className="font-normal">Крупные банки</th><td>{formatNumber(bankDisplayedRate)}</td><td>от 3%</td><td>3–14 дней</td></tr>
                <tr className="border-t border-gray-100 bg-blue-50/40 font-semibold text-[#163B9E]"><th scope="row">Наш сервис</th><td>{formatNumber(displayedRate.value)}</td><td>{formatNumber(commissionPercent)}%</td><td>15–60 минут</td></tr>
              </tbody>
            </table>
          </div>
          {showMinimumWarning && <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><Info className="h-4 w-4 shrink-0" /><span>Минимальная сумма заявки — 500 CNY или эквивалент в выбранной валюте.</span></p>}
        </fieldset>
        <div className="mt-4 border-t border-gray-100 pt-4">
          {status === 'success' ? (
            <div role="status" className="rounded-xl bg-emerald-50 p-4 text-center text-emerald-800">
              <CheckCircle2 className="mx-auto mb-2 h-7 w-7" />
              <p className="font-semibold">Заявка отправлена!</p>
              <p className="mt-1 text-sm">Менеджер получил ваш расчёт и свяжется с вами.</p>
              <button type="button" onClick={() => setStatus('idle')} className="mt-3 text-sm font-medium underline underline-offset-4">Отправить ещё заявку</button>
            </div>
          ) : (
            <fieldset disabled={status === 'sending'} className="min-w-0">
              <legend className="mb-2 text-base font-bold text-gray-900">Оставить заявку</legend>
              <div className="grid min-w-0 gap-3 min-[400px]:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="calculator-name" className="mb-1 block text-xs font-medium text-gray-600">Имя</label>
                  <input id="calculator-name" name="name" type="text" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Как вас зовут" className="input-field min-w-0 w-full rounded-xl px-3 py-3 text-base text-gray-900 sm:text-sm" />
                </div>
                <div className="min-w-0">
                  <label htmlFor="calculator-phone" className="mb-1 block text-xs font-medium text-gray-600">Номер телефона</label>
                  <input id="calculator-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 999 123-45-67" className="input-field min-w-0 w-full rounded-xl px-3 py-3 text-base text-gray-900 sm:text-sm" />
                </div>
              </div>
              <label className="my-3 flex items-start gap-2 text-[11px] leading-relaxed text-gray-500">
                <input name="consent" type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#2457D6]" />
                <span>Соглашаюсь на обработку персональных данных согласно <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-[#2457D6] underline">политике конфиденциальности</a>.</span>
              </label>
              <button type="submit" disabled={status === 'sending'} className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold text-white active:scale-[0.99] disabled:cursor-wait disabled:opacity-70">
                {status === 'sending' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {status === 'sending' ? 'Отправляем…' : 'Оставить заявку'}
              </button>
            </fieldset>
          )}
          <div role="status" aria-live="polite">{status === 'error' && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}</div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500"><LockKeyhole className="h-3 w-3 shrink-0 text-emerald-600" />Данные защищены · Менеджер на связи 24/7</p>
        </div>
      </form>
    </div>
  );
}

function CurrencySelector({ label, value, onChange }: { label: string; value: Currency; onChange: (currency: Currency) => void }) {
  return (
    <div className="relative mr-1 shrink-0">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as Currency)} className="min-h-11 appearance-none rounded-lg bg-transparent py-2 pl-2 pr-6 text-xs font-bold text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm">
        {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
    </div>
  );
}
