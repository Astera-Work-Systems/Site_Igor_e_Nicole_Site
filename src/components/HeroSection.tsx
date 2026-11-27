import { Heart } from 'lucide-react';
import fotoCasal from './assets/Igor_Nicole.jpeg';

const heroImage = fotoCasal;

export default function HeroSection() {
  return (
    <section id="evento" className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-canvas-warm via-canvas to-canvas" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-champagne-100 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-champagne-200 rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Texto */}
          <div className="text-center lg:text-left animate-fade-in-up">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink leading-tight mb-6 text-balance">
              Montando nosso{' '}
              <span className="text-champagne italic">novo lar</span>
              <span className="inline-block ml-2">
                <Heart className="inline w-8 h-8 text-champagne fill-champagne-200" strokeWidth={1.5} />
              </span>
            </h1>

            <p className="text-lg text-ink-soft leading-relaxed mb-4 max-w-xl mx-auto lg:mx-0">
              <span className="font-medium text-ink">Queridos amigos e familiares,</span>{' '}
              optamos por realizar um casamento civil, para nos dedicarmos à construção do nosso novo lar e ao início dessa nova fase.
            </p>
            <p className="text-base text-ink-muted leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Para facilitar a montagem do nosso lar e evitar itens duplicados, deixamos aqui
              algumas sugestões de presentes: presenteie por Pix ou cartão, ou marque que vai
              entregar o presente pessoalmente.{' '}
              <span className="font-semibold text-champagne-dark">
                A lista é só uma sugestão
              </span>{' '}
              — fique à vontade para comprar onde preferir e entregar pessoalmente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() =>
                  document.querySelector('#presentes')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-8 py-4 rounded-full bg-champagne text-white font-semibold shadow-md hover:shadow-xl hover:bg-champagne-dark transition-all duration-300 hover:scale-105"
              >
                Ver Lista de Presentes
              </button>
              <button
                onClick={() =>
                  document.querySelector('#faq')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-8 py-4 rounded-full bg-white border border-champagne-200 text-ink-soft font-semibold hover:bg-champagne-50 hover:border-champagne transition-all duration-300"
              >
                Dúvidas Frequentes
              </button>
            </div>
          </div>

          {/* Foto do casal */}
          <div className="relative animate-scale-in">
            <div className="relative mx-auto max-w-md lg:max-w-lg">
              {/* Moldura decorativa */}
              <div className="absolute -inset-3 rounded-[2rem] border-2 border-champagne-200 opacity-60" />
              <div className="absolute -inset-1 rounded-[2rem] border border-champagne opacity-40" />

              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/5]">
                <img
                  src={heroImage}
                  alt="Igor e Nicole — casal feliz"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
              </div>

              {/* Badge flutuante */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white rounded-2xl shadow-xl px-6 py-4 border border-champagne-100 animate-float">
                <p className="font-serif text-2xl text-champagne leading-none">Igor &amp; Nicole</p>
                <p className="text-xs text-ink-muted tracking-wider uppercase mt-1">
                  juntos para sempre
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
