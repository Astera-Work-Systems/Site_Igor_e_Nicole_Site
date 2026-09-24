import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, CheckCircle2, Gift, HandHeart, Info, Loader2 } from 'lucide-react';
import type { Presente, FiltroPresente } from '@/types';
import { CATEGORIAS } from '@/data/mockData';
import { formatarValor } from '@/lib/utils/cupons';
import { disponibilidade } from '@/lib/utils/presentes';

interface Props {
  presentes: Presente[] | null;
  erro: boolean;
  onTentarNovamente: () => void;
  onSelectPresente: (presente: Presente) => void;
}

const categorias = ['Todos', ...CATEGORIAS];

const filtros: { label: string; value: FiltroPresente }[] = [
  { label: 'Todos os presentes', value: 'todos' },
  { label: 'Até R$ 100', value: 'ate100' },
  { label: 'R$ 100 a R$ 300', value: '100a300' },
  { label: 'Cotas e vaquinhas', value: 'cotas' },
];

export default function GiftVitrine({ presentes, erro, onTentarNovamente, onSelectPresente }: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroPresente>('todos');
  const [busca, setBusca] = useState('');

  const presentesFiltrados = useMemo(() => {
    let lista = (presentes ?? []).filter((p) => p.ativo);

    if (categoriaAtiva !== 'Todos') {
      lista = lista.filter((p) => p.categoria === categoriaAtiva);
    }

    // Filtra pelo menor valor que dá para presentear (unidade, cota ou mínimo do valor livre).
    const entrada = (p: Presente) => disponibilidade(p).valorEntrada;
    if (filtroAtivo === 'ate100') lista = lista.filter((p) => entrada(p) <= 100);
    else if (filtroAtivo === '100a300') lista = lista.filter((p) => entrada(p) > 100 && entrada(p) <= 300);
    else if (filtroAtivo === 'cotas') lista = lista.filter((p) => p.modo !== 'inteiro');

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      lista = lista.filter((p) => p.titulo.toLowerCase().includes(termo));
    }

    return lista;
  }, [presentes, categoriaAtiva, filtroAtivo, busca]);

  return (
    <section id="presentes" className="py-16 md:py-24 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm tracking-[0.3em] uppercase text-champagne font-semibold mb-3">
            Escolha com carinho
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
            Vitrine de Presentes
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            Presenteie por Pix ou cartão — os presentes grandes podem ser divididos em cotas.
            Ao presentear pelo site, você recebe automaticamente números da sorte para o sorteio
            presencial.
          </p>
        </div>

        {/* Aviso "vou dar pessoalmente" — pedido da noiva: evitar presente repetido */}
        <div className="max-w-3xl mx-auto mb-10 flex items-start gap-3 rounded-2xl border border-champagne-200 bg-champagne-50 p-4 sm:p-5">
          <HandHeart className="w-6 h-6 text-champagne-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm text-ink-soft leading-relaxed">
            <strong className="text-ink">Vai comprar o presente e levar pessoalmente?</strong> Que
            alegria! Só pedimos uma coisa: clique em <strong>"Presentear"</strong> e escolha{' '}
            <strong>"Vou dar pessoalmente"</strong>. Assim o item sai da lista e ninguém compra
            repetido.{' '}
            <span className="text-champagne-dark font-medium">
              Se não marcar aqui, não temos como saber.
            </span>
          </p>
        </div>

        {/* Barra de busca */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
            <input
              type="text"
              placeholder="Buscar presente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white border border-champagne-100 shadow-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-champagne focus:ring-2 focus:ring-champagne-100 transition-all"
            />
          </div>
        </div>

        {/* Filtros de valor */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-ink-muted" />
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroAtivo(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filtroAtivo === f.value
                  ? 'bg-champagne text-white shadow-sm'
                  : 'bg-white border border-champagne-100 text-ink-soft hover:border-champagne-200 hover:bg-champagne-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Categorias */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                categoriaAtiva === cat
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white border border-champagne-100 text-ink-soft hover:border-champagne-200 hover:bg-champagne-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de presentes */}
        {erro ? (
          <div className="text-center py-20">
            <Info className="w-12 h-12 text-champagne-200 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-ink-muted mb-4">Não conseguimos carregar a lista agora.</p>
            <button
              onClick={onTentarNovamente}
              className="px-5 py-2.5 rounded-full bg-champagne text-white text-sm font-semibold hover:bg-champagne-dark transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : presentes === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-champagne animate-spin" />
          </div>
        ) : presentesFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="w-16 h-16 text-champagne-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-ink-muted">Nenhum presente encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {presentesFiltrados.map((presente, i) => {
              const d = disponibilidade(presente);
              const esgotado = d.esgotado;

              return (
                <div
                  key={presente.id}
                  className={`group relative bg-white rounded-2xl shadow-sm border border-champagne-100 overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
                    esgotado ? 'opacity-70' : 'hover:border-champagne-200'
                  }`}
                  style={{ animation: `fadeInUp 0.5s ease-out ${i * 0.05}s both` }}
                >
                  {/* Imagem */}
                  <div className="relative aspect-square overflow-hidden bg-champagne-50">
                    <img
                      src={presente.imagem_url}
                      alt={presente.titulo}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        esgotado ? '' : 'group-hover:scale-110'
                      }`}
                      loading="lazy"
                    />
                    {esgotado && (
                      <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 rounded-full text-sm font-bold text-ink uppercase tracking-wider">
                          Já garantido
                        </span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-ink-soft">
                      {presente.categoria}
                    </span>
                    {presente.modo === 'inteiro' && presente.permite_pessoalmente && !esgotado && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-champagne-dark">
                        <HandHeart className="w-3.5 h-3.5" /> Pode dar pessoalmente
                      </span>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5">
                    <h3 className="font-serif text-lg text-ink mb-2 leading-snug min-h-[3.5rem]">
                      {presente.titulo}
                    </h3>

                    {/* Progresso */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                        <span>{d.resumo}</span>
                        <span>{d.restanteTexto}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-champagne-50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-champagne transition-all duration-700"
                          style={{ width: `${d.progresso}%` }}
                        />
                      </div>
                    </div>

                    {/* Valor + CTA */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-ink-muted">{d.rotuloValor}</p>
                        <p className="font-serif text-2xl text-champagne-dark">
                          {formatarValor(esgotado ? presente.valor : d.valorEntrada)}
                        </p>
                      </div>
                      <button
                        disabled={esgotado}
                        onClick={() => onSelectPresente(presente)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                          esgotado
                            ? 'bg-gray-100 text-ink-muted cursor-not-allowed'
                            : 'bg-champagne text-white shadow-sm hover:shadow-md hover:bg-champagne-dark hover:scale-105'
                        }`}
                      >
                        {esgotado ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Garantido
                          </span>
                        ) : (
                          'Presentear'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
