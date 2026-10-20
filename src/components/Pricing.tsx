import { Calculator } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const tiers = [
  { label: 'Alipay / WeChat Pay', rate: '1,6 – 1,8%', desc: 'Пополнение электронных кошельков для оплаты в Китае' },
  { label: 'Поставщику по инвойсу', rate: '1,5%', desc: 'Прямой платёж поставщику по счёту-инвойсу' },
  { label: 'Китайская карта', rate: 'Индивидуально', desc: 'Пополнение банковской карты, выпущенной в Китае' },
];

export function Pricing() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-white to-teal-50/30">
      <div ref={ref} className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="reveal text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-[#0F766E] uppercase tracking-wider mb-3">Комиссии</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Всё существенное. Перед вашим решением.
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Комиссия рассчитывается прозрачно. Окончательный расчёт — под вашу сумму и реквизиты.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {tiers.map((tier) => (
            <div key={tier.label} className="reveal card-shadow bg-white border border-gray-100 rounded-2xl p-7 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 flex items-center justify-center text-[#0F766E] mx-auto mb-4">
                <Calculator className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{tier.label}</h3>
              <p className="text-3xl font-bold text-gradient my-3">{tier.rate}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{tier.desc}</p>
            </div>
          ))}
        </div>

        <p className="reveal text-center text-sm text-gray-400 mt-8 max-w-2xl mx-auto">
          Итоговая сумма включает условия конкретной операции. Курс, возможные расходы, ограничения и сроки
          менеджер подтверждает после проверки реквизитов. Информация на сайте не является публичной офертой.
        </p>
      </div>
    </section>
  );
}
