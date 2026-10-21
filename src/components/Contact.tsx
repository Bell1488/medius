import { useState } from 'react';
import { ArrowRight, Building2, FileText, MapPin, MessageSquare, Phone, Send, User } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { sendLead } from '@/lib/leads';
import { trackGoal } from '@/lib/analytics';
import { PHONE_DISPLAY, PHONE_URL, TELEGRAM_URL } from '@/lib/contacts';

const MIN_LEAD_AMOUNT_CNY = 500;

export function Contact() {
  const ref = useReveal<HTMLDivElement>();
  const [name, setName] = useState(''); const [contact, setContact] = useState(''); const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Поставщику по инвойсу'); const [consent, setConsent] = useState(false);
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
      setStatus('success'); setName(''); setContact(''); setAmount(''); setConsent(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось отправить заявку. Попробуйте еще раз.');
      setStatus('error');
    }
  };
  return <section id="contact" className="py-20 sm:py-28 bg-gradient-to-b from-teal-50/30 to-white scroll-mt-20"><div ref={ref} className="max-w-4xl mx-auto px-5 sm:px-8">
    <div className="reveal text-center mb-12"><p className="text-sm font-semibold text-[#0F766E] uppercase tracking-wider mb-3">Контакты</p><h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Остался один шаг.</h2><p className="mt-4 text-lg text-gray-500">Оставьте телефон или Telegram — обсудим курс и следующий шаг.</p><div className="mt-5 flex flex-wrap justify-center gap-4 text-sm"><a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('telegram_click', { source: 'contact' })} className="inline-flex items-center gap-2 text-[#0F766E] font-semibold"><Send className="w-4 h-4" /> @obmen_CNY_support</a><a href={PHONE_URL} onClick={() => trackGoal('phone_click', { source: 'contact' })} className="inline-flex items-center gap-2 text-gray-700 font-semibold"><Phone className="w-4 h-4" /> {PHONE_DISPLAY}</a></div></div>
    <div className="reveal glass-card rounded-2xl p-8 sm:p-10"><form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
      <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Ваше имя <span className="text-gray-400">(необязательно)</span></label><div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Как вас зовут" className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 text-sm" /></div></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон или Telegram <span className="text-red-500">*</span></label><div className="relative"><MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+7 999 672-52-65 или @username" className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 text-sm" /></div></div>
      <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1.5">Сумма в юанях (CNY)</label><input type="number" required min={MIN_LEAD_AMOUNT_CNY} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Минимум 500 CNY" className="input-field w-full px-4 py-3 rounded-xl text-gray-900 placeholder:text-gray-400" /></div>
      <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1.5">Способ оплаты</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field w-full px-4 py-3 rounded-xl text-gray-900"><option>Поставщику по инвойсу</option><option>Alipay</option><option>WeChat Pay</option><option>Китайская карта</option></select></div>
      <div className="sm:col-span-2 mt-2"><label className="flex items-start gap-2 text-xs text-gray-500 mb-4"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#0F766E]" /><span>Соглашаюсь на обработку персональных данных согласно <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-[#0F766E] underline">политике конфиденциальности</a>.</span></label><button type="submit" disabled={status === 'sending'} className="w-full px-7 py-4 text-base font-semibold text-white btn-gradient rounded-xl flex items-center justify-center gap-2.5 group disabled:opacity-60">Отправить заявку менеджеру <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></button><p role="status" className={`text-center text-xs mt-3 ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-green-600' : 'text-gray-400'}`}>{status === 'sending' ? 'Отправляем заявку…' : status === 'success' ? 'Заявка отправлена. Менеджер свяжется с вами.' : status === 'error' ? errorMessage : 'Заявка отправится менеджеру через защищённый канал связи.'}</p></div>
    </form></div>
    <div className="reveal grid sm:grid-cols-3 gap-4 mt-6"><InfoCard icon={<Building2 className="w-5 h-5" />} label="Компания" value="ООО «Гелиос»" /><InfoCard icon={<FileText className="w-5 h-5" />} label="Реквизиты" value="ИНН 9707058322 · ОГРН 1267700152752" /><InfoCard icon={<MapPin className="w-5 h-5" />} label="Юридический адрес" value="127055, Москва, Новослободская ул., д. 67/69" /></div>
  </div></section>;
}
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-[#0F766E] flex-shrink-0">{icon}</div><div><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-semibold text-gray-900">{value}</p></div></div>; }
