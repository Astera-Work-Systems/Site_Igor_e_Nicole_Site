import { useEffect, useState } from 'react';
import { EVENT_DATE } from '@/data/mockData';

interface TimeLeft {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

function calcularTempo(): TimeLeft {
  const diff = EVENT_DATE.getTime() - new Date().getTime();
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };

  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown() {
  const [tempo, setTempos] = useState<TimeLeft>(calcularTempo());

  useEffect(() => {
    const interval = setInterval(() => setTempos(calcularTempo()), 1000);
    return () => clearInterval(interval);
  }, []);

  const itens = [
    { label: 'Dias', valor: tempo.dias },
    { label: 'Horas', valor: tempo.horas },
    { label: 'Minutos', valor: tempo.minutos },
    { label: 'Segundos', valor: tempo.segundos },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-canvas to-canvas-warm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm tracking-[0.3em] uppercase text-champagne font-semibold mb-3">
            Falta pouco para o grande dia
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink">
            Contagem Regressiva
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {itens.map((item, i) => (
            <div
              key={item.label}
              className="relative group"
              style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both` }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-champagne-100 p-6 md:p-8 text-center transition-all duration-300 hover:shadow-md hover:border-champagne-200 hover:-translate-y-1">
                <div className="font-serif text-4xl md:text-6xl text-champagne tabular-nums leading-none mb-2">
                  {String(item.valor).padStart(2, '0')}
                </div>
                <p className="text-xs md:text-sm tracking-wider uppercase text-ink-muted font-medium">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 text-ink-muted text-sm">
          <span className="font-serif text-lg text-ink">10 de Abril de 2027</span> às{' '}
          <span className="font-serif text-lg text-ink">18h00</span> · Gurupi, Tocantins
        </p>
      </div>
    </section>
  );
}
