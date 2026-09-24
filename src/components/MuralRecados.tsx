import { Quote, Heart, Plus } from 'lucide-react';
import { formatarData } from '@/lib/utils/cupons';
import { criarRecado, listarRecados } from '@/lib/api';
import type { Recado } from '@/types';
import { useEffect, useState } from 'react';

export default function MuralRecados() {
  const [recados, setRecados] = useState<Recado[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [novoRecado, setNovoRecado] = useState({ nome: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarRecados().then(setRecados).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novoRecado.nome.trim().length < 3 || novoRecado.mensagem.trim().length < 5) {
      setErro('Escreva seu nome e uma mensagem um pouquinho maior.');
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      const recado = await criarRecado(novoRecado.nome, novoRecado.mensagem);
      setRecados([recado, ...recados]);
      setNovoRecado({ nome: '', mensagem: '' });
      setShowForm(false);
    } catch {
      setErro('Não foi possível enviar agora. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section id="recados" className="py-16 md:py-24 bg-canvas-warm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm tracking-[0.3em] uppercase text-champagne font-semibold mb-3">
            Com carinho de quem ama
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
            Mural de Recados
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            Mensagens de bênção e carinho deixadas pelos convidados. Deixe também a sua!
          </p>
        </div>

        {/* Botão adicionar */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-champagne-200 text-ink-soft font-medium hover:bg-champagne-50 hover:border-champagne transition-all duration-300"
          >
            <Plus className="w-5 h-5 text-champagne" />
            Deixar um recado
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto mb-10 bg-white rounded-2xl shadow-sm border border-champagne-100 p-6 animate-slide-up"
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={novoRecado.nome}
                onChange={(e) => setNovoRecado({ ...novoRecado, nome: e.target.value })}
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-champagne-100 bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100 transition-all"
              />
              <textarea
                placeholder="Sua mensagem de bênção para os noivos..."
                value={novoRecado.mensagem}
                onChange={(e) => setNovoRecado({ ...novoRecado, mensagem: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-champagne-100 bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100 transition-all resize-none"
              />
              {erro && <p className="text-xs text-error">{erro}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={enviando}
                  className="disabled:opacity-60 flex-1 py-3 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors"
                >
                  {enviando ? 'Enviando...' : 'Enviar recado'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-full bg-white border border-champagne-200 text-ink-soft hover:bg-champagne-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Grid de recados */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {recados.map((recado, i) => (
            <div
              key={recado.id}
              className="break-inside-avoid bg-white rounded-2xl shadow-sm border border-champagne-100 p-6 transition-all duration-300 hover:shadow-md hover:border-champagne-200"
              style={{ animation: `fadeInUp 0.5s ease-out ${i * 0.08}s both` }}
            >
              <Quote className="w-8 h-8 text-champagne-200 mb-3" strokeWidth={1} />
              <p className="text-ink-soft text-sm leading-relaxed mb-4 italic">
                "{recado.mensagem}"
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-champagne-50">
                <div>
                  <p className="font-serif text-sm text-ink">{recado.nome_convidado}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{formatarData(recado.created_at)}</p>
                </div>
                <Heart className="w-4 h-4 text-champagne-200 fill-champagne-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
