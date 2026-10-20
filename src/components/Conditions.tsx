import { Search, Calculator, Clock, MessageSquare } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const conditions = [
  { icon: Search, title: 'Проверяем до оплаты', description: 'Уточняем данные получателя и назначение платежа до проведения операции.' },
  { icon: Calculator, title: 'Согласуем полный расчёт', description: 'Курс, итоговую сумму в рублях и возможные расходы обсуждаем заранее.' },
  { icon: Clock, title: 'Обозначаем срок', description: 'Время проведения зависит от направления. Подтверждаем его до перевода.' },
  { icon: MessageSquare, title: 'Остаёмся на связи', description: 'Один контакт для вопросов, согласований и подтверждения результата.' },
];

export function Conditions() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="conditions" className="py-20 sm:py-28 bg-gradient-to-b from-teal-50/30 to-white scroll-mt-20">
      <div ref={ref} className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="reveal text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-[#0F766E] uppercase tracking-wider mb-3">Условия</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Не обещания. Понятные условия.
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Вы знаете, за что платите, куда направляются средства и что произойдёт дальше.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {conditions.map((item) => (
            <div key={item.title} className="reveal card-shadow bg-white border border-gray-100 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 flex items-center justify-center text-[#0F766E] mb-5">
                <item.icon className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
