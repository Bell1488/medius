import { useEffect, useState } from 'react';
import { ArrowUpRight, Building2, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

const officePhotos = [
  { src: '/office1.png', alt: 'Рабочее место в офисе MediusObmen' },
  { src: '/office2.png', alt: 'Офис MediusObmen' },
  { src: '/office3.png', alt: 'Рабочая зона офиса MediusObmen' },
];

export function About() {
  const ref = useReveal<HTMLDivElement>();
  const [activePhoto, setActivePhoto] = useState<number | null>(null);

  useEffect(() => {
    if (activePhoto === null) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePhoto(null);
      if (event.key === 'ArrowRight') setActivePhoto((index) => (index === null ? 0 : (index + 1) % officePhotos.length));
      if (event.key === 'ArrowLeft') setActivePhoto((index) => (index === null ? officePhotos.length - 1 : (index - 1 + officePhotos.length) % officePhotos.length));
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activePhoto]);

  const showPrevious = () => setActivePhoto((index) => (index === null ? 0 : (index - 1 + officePhotos.length) % officePhotos.length));
  const showNext = () => setActivePhoto((index) => (index === null ? 0 : (index + 1) % officePhotos.length));

  return (
    <section id="about" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="reveal">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#2457D6]">О нас</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Помогаем проводить сделки с Китаем спокойно.</h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              MediusObmen занимается обменами, оплатами, выкупом и доставкой товаров из Китая. Согласуем условия заранее, проверяем детали и остаёмся на связи до завершения операции.
            </p>
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-[#163B9E]">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#2457D6]" />
              <div>
                <p className="font-semibold">Наш офис</p>
                <p className="mt-1 leading-relaxed">г. Всеволожск, Межевая ул., д. 27, помещ. 10/1</p>
              </div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
              <Building2 className="h-4 w-4 text-[#2457D6]" />
              ООО «Медиус»
            </div>
          </div>

          <div className="reveal grid min-w-0 gap-3 sm:grid-cols-[1.15fr_0.85fr] sm:grid-rows-2">
            <GalleryButton
              photo={officePhotos[0]}
              onClick={() => setActivePhoto(0)}
              className="aspect-[4/3] sm:row-span-2 sm:aspect-auto"
            />
            <GalleryButton photo={officePhotos[1]} onClick={() => setActivePhoto(1)} className="aspect-[4/3]" />
            <GalleryButton photo={officePhotos[2]} onClick={() => setActivePhoto(2)} className="aspect-[4/3]" />
          </div>
        </div>
      </div>

      {activePhoto !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Галерея офиса"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#081126]/90 p-4 sm:p-8"
          onClick={() => setActivePhoto(null)}
        >
          <button
            type="button"
            aria-label="Закрыть галерею"
            onClick={() => setActivePhoto(null)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-7 sm:top-7"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Предыдущее фото"
            onClick={(event) => { event.stopPropagation(); showPrevious(); }}
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-7"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={officePhotos[activePhoto].src}
            alt={officePhotos[activePhoto].alt}
            className="max-h-[88vh] max-w-[calc(100vw-5rem)] rounded-xl object-contain shadow-2xl sm:max-w-[calc(100vw-12rem)]"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Следующее фото"
            onClick={(event) => { event.stopPropagation(); showNext(); }}
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-7"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">{activePhoto + 1} / {officePhotos.length}</p>
        </div>
      )}
    </section>
  );
}

function GalleryButton({ photo, onClick, className }: { photo: typeof officePhotos[number]; onClick: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Открыть: ${photo.alt}`}
      className={`group relative min-w-0 overflow-hidden rounded-2xl bg-gray-100 text-left ${className}`}
    >
      <img src={photo.src} alt={photo.alt} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-[#101B36]/55 via-transparent to-transparent opacity-80" />
      <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#101B36] shadow-sm transition group-hover:bg-white">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </button>
  );
}
