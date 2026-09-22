import { MapPin, Navigation, ExternalLink, Clock } from 'lucide-react';
import { EVENT_LOCATION, EVENT_DATE } from '@/data/mockData';

export default function LocationSection() {
  return (
    <section id="local" className="py-16 md:py-24 bg-canvas">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm tracking-[0.3em] uppercase text-champagne font-semibold mb-3">
            Onde será nosso encontro
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
            Local do Evento
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            Estamos preparando tudo com muito carinho para receber vocês neste dia tão especial.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Card de info */}
          <div className="bg-white rounded-3xl shadow-sm border border-champagne-100 p-8 md:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-champagne-50 border border-champagne-100 flex-shrink-0">
                <MapPin className="w-6 h-6 text-champagne" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-serif text-xl text-ink mb-1">{EVENT_LOCATION.nome}</h3>
                <p className="text-sm text-ink-muted">
                  Gurupi — Tocantins, Brasil
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-champagne-50 border border-champagne-100 flex-shrink-0">
                <Clock className="w-6 h-6 text-champagne" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-serif text-xl text-ink mb-1">10 de Abril de 2027</h3>
                <p className="text-sm text-ink-muted">A partir das 18h00</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a
                href={EVENT_LOCATION.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-champagne text-white font-semibold shadow-sm hover:shadow-md hover:bg-champagne-dark transition-all duration-300"
              >
                <ExternalLink className="w-5 h-5" />
                Abrir no Google Maps
              </a>
              <a
                href={EVENT_LOCATION.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white border border-champagne-200 text-ink-soft font-semibold hover:bg-champagne-50 transition-all duration-300"
              >
                <Navigation className="w-5 h-5 text-champagne" />
                Abrir no Waze
              </a>
            </div>
          </div>

          {/* Mapa visual */}
          <div className="relative rounded-3xl overflow-hidden shadow-md border border-champagne-100 aspect-[4/3] md:aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-champagne-50 via-canvas-warm to-champagne-100" />
            {/* Decorative map-like pattern */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                <path d="M0 200 Q100 150 200 200 T400 200" stroke="#C5A059" strokeWidth="2" />
                <path d="M0 100 Q100 50 200 100 T400 100" stroke="#C5A059" strokeWidth="1" />
                <path d="M0 300 Q100 250 200 300 T400 300" stroke="#C5A059" strokeWidth="1" />
                <path d="M100 0 Q150 100 100 200 T100 400" stroke="#C5A059" strokeWidth="1" />
                <path d="M200 0 Q250 100 200 200 T200 400" stroke="#C5A059" strokeWidth="1" />
                <path d="M300 0 Q350 100 300 200 T300 400" stroke="#C5A059" strokeWidth="1" />
              </svg>
            </div>
            {/* Pin central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-champagne/20 animate-pulse-soft" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-champagne shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <p className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-ink shadow-sm">
                    Gurupi, TO
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
