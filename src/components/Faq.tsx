import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const faqs = [
  { q: 'Какой курс юаня вы предлагаете?', a: 'Актуальный курс согласуем индивидуально под сумму и способ оплаты. Перед операцией менеджер сообщает итоговую сумму в рублях. Она фиксируется до перевода.' },
  { q: 'Какая комиссия за перевод?', a: 'Отдельную комиссию за перевод не добавляем. Итоговый курс и возможные расходы по конкретной операции согласуем до оплаты.' },
  { q: 'Сколько времени занимает платёж?', a: 'Срок зависит от выбранного направления, реквизитов и условий проведения. Менеджер подтвердит ожидаемое время после проверки данных и до оплаты.' },
  { q: 'Как начать работу?', a: 'Укажите способ оплаты и сумму в CNY через калькулятор наверху. Реквизиты получателя передайте менеджеру в личном чате. После проверки он подтвердит доступность операции и условия.' },
  { q: 'Можно ли оплатить по инвойсу поставщика?', a: 'Да. Передайте инвойс на проверку. Назначение платежа, реквизиты, возможность операции и итоговую сумму согласуем до перевода.' },
  { q: 'Какое подтверждение я получу после платежа?', a: 'Формат подтверждения согласуем до операции. После проведения платежа передадим его через согласованный канал связи.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className={`text-base font-medium transition-colors pr-4 ${open ? 'text-[#2457D6]' : 'text-gray-900 group-hover:text-[#2457D6]'}`}>
          {q}
        </span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-[#2457D6]' : 'text-gray-400'}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48' : 'max-h-0'}`}>
        <p className="pb-5 text-gray-500 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export function Faq() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="faq" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div ref={ref} className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="reveal text-center mb-12">
          <p className="text-sm font-semibold text-[#2457D6] uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Отвечаем по существу.</h2>
        </div>
        <div className="reveal">
          {faqs.map((item) => <FaqItem key={item.q} {...item} />)}
        </div>
      </div>
    </section>
  );
}
