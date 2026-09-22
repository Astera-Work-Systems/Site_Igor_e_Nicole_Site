import { useEffect, useState } from 'react';
import { Menu, X, Heart } from 'lucide-react';

const navLinks = [
  { label: 'O Evento', href: '#evento' },
  { label: 'Presentes', href: '#presentes' },
  { label: 'Sorteio', href: '#sorteio' },
  { label: 'Recados', href: '#recados' },
  { label: 'Local', href: '#local' },
  { label: 'FAQ', href: '#faq' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-canvas/85 backdrop-blur-xl shadow-[0_1px_20px_rgba(0,0,0,0.06)]'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Monograma */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-champagne transition-transform group-hover:scale-110">
              <Heart className="w-5 h-5 text-champagne" strokeWidth={1.5} />
            </div>
            <div className="text-left leading-none">
              <span className="font-serif text-lg md:text-xl text-ink tracking-wide">
                Igor <span className="text-champagne">&amp;</span> Nicole
              </span>
              <p className="text-[10px] tracking-[0.2em] uppercase text-ink-muted mt-0.5">
                Chá de Panela
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="text-sm font-medium text-ink-soft hover:text-champagne transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-champagne transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            <button
              onClick={() => handleNav('#presentes')}
              className="px-5 py-2.5 rounded-full bg-champagne text-white text-sm font-semibold shadow-sm hover:shadow-md hover:bg-champagne-dark transition-all duration-300"
            >
              Presentear
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-ink-soft hover:text-champagne transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-400 ${
            menuOpen ? 'max-h-96 pb-4' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="text-left px-4 py-3 rounded-xl text-ink-soft hover:bg-champagne-50 hover:text-champagne transition-colors duration-200 font-medium"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleNav('#presentes')}
              className="mt-2 mx-4 px-5 py-3 rounded-full bg-champagne text-white font-semibold shadow-sm text-center"
            >
              Presentear
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
