import { FileText, Wallet, Banknote, CreditCard, ArrowRight } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const services = [
  {
    icon: FileText,
    title: 'Поставщику по инвойсу',
    description: 'Передайте счёт на проверку. Уточним реквизиты, назначение платежа и возможность проведения.',
    steps: ['Проверка реквизитов', 'Согласование суммы', 'Подтверждение операции'],
    badge: '1,5%',
  },
  {
    icon: Wallet,
    title: 'Alipay / WeChat Pay',
    description: 'Пополнение для оплаты в Китае. Сумму, способ и доступность направления подтверждаем заранее.',
    steps: null,
    badge: 'от 1,6%',
  },
  {
    icon: Banknote,
    title: 'Рубли → юани',
    description: 'Согласуем курс и сумму в рублях под конкретный платёж. Без скрытых комиссий.',
    steps: null,
    badge: null,
  },
  {
    icon: CreditCard,
    title: 'Китайская карта',
    description: 'Проверим реквизиты и уточним возможность пополнения китайской банковской карты.',
    steps: null,
    badge: null,
  },
  {
    icon: Banknote,
    title: 'Работа с наличными',
    description: 'Условия, сумму и место встречи согласуем с менеджером заранее.',
    steps: null,
    badge: null,
  },
];

export function Services() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="services" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div ref={ref} className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="reveal text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-[#2457D6] uppercase tracking-wider mb-3">Услуги</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Разные задачи. Один понятный сервис.
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Вы выбираете, куда направить платёж. Мы помогаем согласовать и провести операцию.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {services.map((service) => (
            <div
              key={service.title}
              className="reveal card-shadow bg-white border border-gray-100 rounded-2xl p-7 sm:p-8 group"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center text-[#2457D6] group-hover:from-[#2457D6] group-hover:to-[#163B9E] group-hover:text-white transition-all duration-300">
                  <service.icon className="w-6 h-6" strokeWidth={1.8} />
                </div>
                {service.badge && (
                  <span className="px-3 py-1 bg-blue-50 text-[#2457D6] text-sm font-semibold rounded-full">
                    {service.badge}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-500 leading-relaxed">{service.description}</p>
              {service.steps && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.steps.map((step, i) => (
                    <span key={step} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {step}
                      {i < service.steps!.length - 1 && <span className="text-gray-300 mx-0.5">·</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="reveal text-center mt-10">
          <button
            onClick={() => document.querySelector('#calculator')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#2457D6] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
          >
            Рассчитать платёж
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
