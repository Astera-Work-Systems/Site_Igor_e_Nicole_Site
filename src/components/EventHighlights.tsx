import { UtensilsCrossed, Heart, Ticket } from 'lucide-react';

const destaques = [
  {
    icon: UtensilsCrossed,
    titulo: 'Lanche & Confraternização',
    descricao:
      'Recepção aconchegante para reunir todos os convidados em um clima de alegria e proximidade.',
    emoji: '🍔',
  },
  {
    icon: Heart,
    titulo: 'Momento de Agradecimento',
    descricao:
      'Retribuição presencial de todo o carinho recebido, com palavras sinceras e muito afeto.',
    emoji: '❤️',
  },
  {
    icon: Ticket,
    titulo: 'Sorteio de Brindes',
    descricao:
      'Cada R$ 50 em presentes no site concede 1 cupom para o sorteio presencial no dia do evento.',
    emoji: '🎟️',
  },
];

export default function EventHighlights() {
  return (
    <section id="sorteio" className="py-16 md:py-24 bg-canvas-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm tracking-[0.3em] uppercase text-champagne font-semibold mb-3">
            O que esperar do nosso encontro
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
            Destaques do Evento Presencial
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            Mais do que presentes, queremos celebrar com vocês um momento único de
            confraternização, gratidão e muita alegria.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {destaques.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.titulo}
                className="group relative bg-white rounded-2xl shadow-sm border border-champagne-100 p-8 text-center transition-all duration-500 hover:shadow-xl hover:-translate-y-2 hover:border-champagne-200"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.15}s both` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-champagne-50 border border-champagne-100 mb-6 transition-all duration-500 group-hover:bg-champagne group-hover:border-champagne group-hover:scale-110">
                  <Icon className="w-8 h-8 text-champagne transition-colors duration-500 group-hover:text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl text-ink mb-3">{item.titulo}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{item.descricao}</p>

                <div className="absolute top-4 right-4 text-2xl opacity-30 group-hover:opacity-60 transition-opacity">
                  {item.emoji}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
