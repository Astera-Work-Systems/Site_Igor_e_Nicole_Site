import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqItems } from '@/data/mockData';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 bg-canvas-warm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-champagne-50 border border-champagne-100 mb-4">
            <HelpCircle className="w-7 h-7 text-champagne" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">
            Perguntas Frequentes
          </h2>
          <p className="text-ink-muted">
            Tudo o que você precisa saber sobre o nosso Chá de Panela
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border transition-all duration-300 ${
                  isOpen ? 'border-champagne-200 shadow-md' : 'border-champagne-100 shadow-sm hover:border-champagne-200'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-serif text-base text-ink">{item.pergunta}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-champagne flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-400 ${
                    isOpen ? 'max-h-60' : 'max-h-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-sm text-ink-soft leading-relaxed">
                    {item.resposta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
