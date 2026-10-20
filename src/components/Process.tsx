import { ClipboardList, CheckCircle2, FileCheck2 } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const steps = [
  { icon: ClipboardList, title: 'Вы передаёте задачу', description: 'Способ оплаты, сумма в юанях и реквизиты получателя или инвойс.' },
  { icon: FileCheck2, title: 'Мы согласуем условия', description: 'Проверяем возможность операции, фиксируем курс, сумму и срок до оплаты.' },
  { icon: CheckCircle2, title: 'Вы получаете подтверждение', description: 'После проведения платежа передаём подтверждение в согласованном формате.' },
];

export function Process() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="process" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div ref={ref} className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="reveal text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-[#0F766E] uppercase tracking-wider mb-3">Процесс</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Три шага. Никакой неопределённости.
          </h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-teal-100 via-teal-300 to-teal-100" />

          {steps.map((step, i) => (
            <div key={step.title} className="reveal text-center relative">
              <div className="relative inline-flex">
                <div className="w-14 h-14 rounded-2xl btn-gradient flex items-center justify-center text-white mx-auto relative z-10">
                  <step.icon className="w-7 h-7" strokeWidth={1.7} />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-white border-2 border-[#0F766E] text-[#0F766E] rounded-full flex items-center justify-center text-xs font-bold z-20">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
