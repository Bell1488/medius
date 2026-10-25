import { useState } from 'react';
import { ArrowRight, Building2, FileText, MapPin, MessageSquare, Phone, Send, User } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { sendLead } from '@/lib/leads';
import { trackGoal } from '@/lib/analytics';
import { PHONE_DISPLAY, PHONE_URL, TELEGRAM_URL } from '@/lib/contacts';

const MIN_LEAD_AMOUNT_CNY = 500;

export function Contact() {
  const ref = useReveal<HTMLDivElement>();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Поставщику по инвойсу');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const amountValue = Number(amount.replace(',', '.'));
    if (!Number.isFinite(amountValue) || amountValue < MIN_LEAD_AMOUNT_CNY) {
      setErrorMessage(`Минимальная сумма заявки — ${MIN_LEAD_AMOUNT_CNY.toLocaleString('ru-RU')} CNY.`);
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await sendLead({ name, contact, amount, paymentMethod, consent });
      trackGoal('lead_submit', { source: 'contact' });
      setStatus('success');
      setName('');
      setContact('');
      setAmount('');
      setConsent(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось отправить заявку. Попробуйте еще раз.');
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 bg-gradient-to-b from-blue-50/45 to-white py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="reveal mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#2457D6]">Контакты</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Остался один шаг.</h2>
          <p className="mt-4 text-lg text-gray-500">Оставьте телефон или Telegram — обсудим курс и следующий шаг.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'contact' })} className="inline-flex items-center gap-2 font-semibold text-[#2457D6]"><Send className="h-4 w-4" /> @obmen_CNY_support</a>
            <a href={PHONE_URL} onClick={() => trackGoal('phone_click', { source: 'contact' })} className="inline-flex items-center gap-2 font-semibold text-gray-700"><Phone className="h-4 w-4" /> {PHONE_DISPLAY}</a>
          </div>
        </div>

        <div className="reveal glass-card rounded-2xl p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Ваше имя <span className="text-gray-400">(необязательно)</span></label>
              <div className="relative"><User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Как вас зовут" className="input-field w-full rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900" /></div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Телефон или Telegram <span className="text-red-500">*</span></label>
              <div className="relative"><MessageSquare className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+7 999 672-52-65 или @username" className="input-field w-full rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900" /></div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Сумма в юанях (CNY)</label>
              <input type="number" required min={MIN_LEAD_AMOUNT_CNY} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Минимум 500 CNY" className="input-field w-full rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Способ оплаты</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field w-full rounded-xl px-4 py-3 text-gray-900"><option>Поставщику по инвойсу</option><option>Alipay</option><option>WeChat Pay</option><option>Китайская карта</option></select>
            </div>
            <div className="mt-2 sm:col-span-2">
              <label className="mb-4 flex items-start gap-2 text-xs text-gray-500"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#2457D6]" /><span>Соглашаюсь на обработку персональных данных согласно <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-[#2457D6] underline">политике конфиденциальности</a>.</span></label>
              <button type="submit" disabled={status === 'sending'} className="group flex w-full items-center justify-center gap-2.5 rounded-xl px-7 py-4 text-base font-semibold text-white btn-gradient disabled:opacity-60">Отправить заявку менеджеру <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></button>
              <p role="status" className={`mt-3 text-center text-xs ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-green-600' : 'text-gray-400'}`}>{status === 'sending' ? 'Отправляем заявку…' : status === 'success' ? 'Заявка отправлена. Менеджер свяжется с вами.' : status === 'error' ? errorMessage : 'Заявка отправится менеджеру через защищённый канал связи.'}</p>
            </div>
          </form>
        </div>

        <div className="reveal mt-6 grid gap-4 sm:grid-cols-3">
          <InfoCard icon={<Building2 className="h-5 w-5" />} label="Компания" value="ООО «Медиус»" />
          <InfoCard icon={<FileText className="h-5 w-5" />} label="ИНН / КПП" value="4706097150 / 470601001" />
          <InfoCard icon={<MapPin className="h-5 w-5" />} label="Юридический адрес" value="188640, Ленинградская обл., Всеволожский р-н, г. Всеволожск, Межевая ул., д. 27, помещ. 10/1" />
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">ОГРН 1264700006086 · зарегистрировано 24.04.2026 · уставный капитал 100 000 ₽</p>
      </div>
    </section>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2457D6]">{icon}</div><div><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-semibold text-gray-900">{value}</p></div></div>;
}
