import { Heart, Mail, Phone, Sparkles } from 'lucide-react';
import { ASTERA_INFO } from '@/data/mockData';

export default function Footer() {
  return (
    <footer className="relative bg-ink text-white pt-16 pb-8 overflow-hidden">
      {/* Decoração */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-champagne/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-champagne/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-champagne mb-4">
            <Heart className="w-7 h-7 text-champagne" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-3xl mb-2">
            Igor <span className="text-champagne">&amp;</span> Nicole
          </h2>
          <p className="text-white/60 text-sm tracking-wider uppercase">
            10 de Abril de 2027 · Gurupi, Tocantins
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-white/10" />
          <Sparkles className="w-5 h-5 text-champagne" />
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Astera Work Systems */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-white/40 mb-3">
            Desenvolvido com dedicação por
          </p>
          <h3 className="font-serif text-xl text-champagne mb-3">Astera Work Systems</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/60">
            <a
              href={`mailto:${ASTERA_INFO.email}`}
              className="flex items-center gap-2 hover:text-champagne transition-colors"
            >
              <Mail className="w-4 h-4" />
              {ASTERA_INFO.email}
            </a>
            <a
              href={`https://wa.me/${ASTERA_INFO.telefoneRaw}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-champagne transition-colors"
            >
              <Phone className="w-4 h-4" />
              {ASTERA_INFO.telefone}
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            © 2026 Igor &amp; Nicole · Chá de Panela · Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
