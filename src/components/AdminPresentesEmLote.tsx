import { useRef, useState } from 'react';
import { Image as ImageIcon, Images, Loader2, Save, Trash2, Upload, X } from 'lucide-react';
import { CATEGORIAS } from '@/data/mockData';
import * as admin from '@/lib/admin';
import { formatarValor } from '@/lib/utils/cupons';
import { MODOS_PRESENTE } from '@/lib/utils/presentes';
import type { ModoPresente } from '@/types';

/**
 * Cadastro de vários presentes de uma vez: cola uma lista (do Excel, Google Planilhas
 * ou bloco de notas), confere/ajusta numa tabela, envia as fotos e salva tudo junto.
 */

interface Linha {
  chave: number;
  titulo: string;
  valor: number;
  quantidade: number;
  categoria: string;
  modo: ModoPresente;
  imagem_url: string;
  enviando: boolean;
}

const EXEMPLO = `Jogo de panelas; 299,90; 2; Cozinha
Air fryer; 450
Cota da geladeira; 100; 10; Cotas Grandes
Toalhas de banho; R$ 89,90; 3; Cama & Banho`;

/** Aceita "1.299,90", "R$ 89,90", "1.000", "450" e "89.9". */
function lerValor(texto: string): number {
  let t = texto.replace(/r\$|\s/gi, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); // "1.000" = mil
  const n = parseFloat(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

let proximaChave = 1;

function lerLista(texto: string, categoriaPadrao: string): Linha[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l): Linha => {
      // Excel/Planilhas colam com TAB; à mão a pessoa usa ; ou |
      const [titulo = '', valor = '', qtd = '', cat = ''] = l.split(/\t|;|\|/).map((c) => c.trim());
      const categoria = CATEGORIAS.find((c) => c.toLowerCase() === cat.toLowerCase()) ?? categoriaPadrao;
      return {
        chave: proximaChave++,
        titulo,
        valor: lerValor(valor),
        quantidade: Math.max(1, parseInt(qtd) || 1),
        categoria,
        modo: categoria === 'Cotas Grandes' ? 'cotas' : 'inteiro',
        imagem_url: '',
        enviando: false,
      };
    })
    .filter((l) => l.titulo);
}

export function AdminPresentesEmLote({ onSalvo, onCancel }: { onSalvo: () => void; onCancel: () => void }) {
  const [texto, setTexto] = useState('');
  const [categoriaPadrao, setCategoriaPadrao] = useState(CATEGORIAS[0]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  // Fotos enviadas nesta tela: as que não forem salvas num presente são apagadas do Storage.
  const enviadas = useRef<string[]>([]);

  const alterar = (chave: number, campos: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...campos } : l)));

  const enviarFoto = async (chave: number, arquivo: File) => {
    alterar(chave, { enviando: true });
    try {
      const url = await admin.enviarImagemPresente(arquivo);
      enviadas.current.push(url);
      alterar(chave, { imagem_url: url, enviando: false });
    } catch (err) {
      alterar(chave, { enviando: false });
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar uma das fotos.');
    }
  };

  /** Várias fotos de uma vez: vão preenchendo, na ordem, os presentes que ainda estão sem foto. */
  const enviarVariasFotos = async (arquivos: File[]) => {
    const semFoto = linhas.filter((l) => !l.imagem_url && !l.enviando);
    const pares = semFoto.slice(0, arquivos.length).map((l, i) => [l.chave, arquivos[i]] as const);
    if (arquivos.length > semFoto.length) {
      setErro(`Só ${semFoto.length} presente(s) estavam sem foto; as fotos a mais foram ignoradas.`);
    }
    // 3 por vez: rápido sem travar celular fraco.
    for (let i = 0; i < pares.length; i += 3) {
      await Promise.all(pares.slice(i, i + 3).map(([chave, arq]) => enviarFoto(chave, arq)));
    }
  };

  const cancelar = () => {
    enviadas.current.forEach((u) => void admin.removerImagemPresente(u));
    onCancel();
  };

  const remover = (l: Linha) => {
    if (l.imagem_url) void admin.removerImagemPresente(l.imagem_url);
    setLinhas((ls) => ls.filter((x) => x.chave !== l.chave));
  };

  const problemas = linhas.filter((l) => !l.titulo.trim() || l.valor <= 0 || !l.imagem_url);
  const enviandoAlguma = linhas.some((l) => l.enviando);

  const salvar = async () => {
    if (problemas.length) {
      setErro(`${problemas.length} presente(s) estão sem nome, valor ou foto (marcados em vermelho).`);
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await admin.criarPresentes(
        linhas.map((l) => ({
          id: '',
          titulo: l.titulo.trim(),
          categoria: l.categoria,
          imagem_url: l.imagem_url,
          modo: l.modo,
          valor: l.valor,
          quantidade_total: l.quantidade,
          valor_minimo: null,
          permite_pessoalmente: true,
          ativo: true,
        })),
      );
      onSalvo();
    } catch {
      setErro('Não foi possível salvar. Nenhum presente foi criado; tente de novo.');
      setSalvando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-champagne-100 p-6 mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-lg text-ink">Adicionar vários presentes</h4>
        <button type="button" onClick={cancelar} className="p-1.5 rounded-full hover:bg-champagne-50">
          <X className="w-5 h-5 text-ink-soft" />
        </button>
      </div>

      {linhas.length === 0 ? (
        <>
          <div className="text-sm text-ink-soft space-y-1">
            <p>
              Um presente por linha: <strong>Nome; Valor; Quantidade; Categoria</strong>. Só o nome e o valor são
              obrigatórios.
            </p>
            <p className="text-ink-muted text-xs">
              Pode copiar e colar direto de uma planilha (Excel ou Google Planilhas) com as colunas nessa ordem.
            </p>
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            placeholder={EXEMPLO}
            className={`${inputClass} font-mono text-sm`}
          />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Categoria quando não informada</label>
              <select
                value={categoriaPadrao}
                onChange={(e) => setCategoriaPadrao(e.target.value)}
                className={inputClass}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!texto.trim()}
              onClick={() => {
                const novas = lerLista(texto, categoriaPadrao);
                if (!novas.length) return setErro('Não encontrei nenhum presente no texto.');
                setErro('');
                setLinhas(novas);
              }}
              className="px-6 py-2.5 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors disabled:opacity-60"
            >
              Continuar
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              Confira os {linhas.length} presentes. Dá para corrigir qualquer campo aqui mesmo.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-champagne-200 text-sm text-ink-soft hover:bg-champagne-50 transition-colors cursor-pointer">
              <Images className="w-4 h-4" />
              Escolher várias fotos de uma vez
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  // A ordem que o navegador entrega varia; pelo nome ("01-...", "02-...") fica previsível.
                  const arquivos = Array.from(e.target.files ?? []).sort((a, b) =>
                    a.name.localeCompare(b.name, 'pt-BR', { numeric: true }),
                  );
                  e.target.value = '';
                  void enviarVariasFotos(arquivos);
                }}
              />
            </label>
          </div>
          <p className="text-xs text-ink-muted -mt-2">
            As fotos entram em ordem alfabética do nome do arquivo (numere: 01, 02...), nos presentes ainda sem foto. Clique numa foto para trocar.
          </p>

          <div className="space-y-2">
            {linhas.map((l) => {
              const faltaAlgo = !l.titulo.trim() || l.valor <= 0 || !l.imagem_url;
              return (
                <div
                  key={l.chave}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl border ${
                    faltaAlgo && erro ? 'border-error bg-error-light/40' : 'border-champagne-100'
                  }`}
                >
                  <label className="w-14 h-14 flex-shrink-0 rounded-lg border border-champagne-100 bg-champagne-50 overflow-hidden flex items-center justify-center cursor-pointer">
                    {l.enviando ? (
                      <Loader2 className="w-5 h-5 text-champagne animate-spin" />
                    ) : l.imagem_url ? (
                      <img src={l.imagem_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-ink-muted" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const arq = e.target.files?.[0];
                        e.target.value = '';
                        if (!arq) return;
                        if (l.imagem_url) void admin.removerImagemPresente(l.imagem_url);
                        void enviarFoto(l.chave, arq);
                      }}
                    />
                  </label>
                  <input
                    value={l.titulo}
                    onChange={(e) => alterar(l.chave, { titulo: e.target.value })}
                    placeholder="Nome"
                    className={`${inputCompacto} flex-1 min-w-[10rem]`}
                  />
                  <select
                    value={l.modo}
                    onChange={(e) => alterar(l.chave, { modo: e.target.value as ModoPresente })}
                    className={`${inputCompacto} w-32`}
                    title="Como o presente é dado"
                  >
                    {(Object.keys(MODOS_PRESENTE) as ModoPresente[]).map((m) => (
                      <option key={m} value={m}>
                        {MODOS_PRESENTE[m].nome}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l.valor || ''}
                    onChange={(e) => alterar(l.chave, { valor: parseFloat(e.target.value) || 0 })}
                    placeholder={l.modo === 'livre' ? 'Meta R$' : 'Valor R$'}
                    title={l.modo === 'livre' ? 'Meta total' : l.modo === 'cotas' ? 'Valor de cada cota' : 'Valor'}
                    className={`${inputCompacto} w-28`}
                  />
                  {l.modo !== 'livre' && (
                    <input
                      type="number"
                      min="1"
                      value={l.quantidade}
                      onChange={(e) => alterar(l.chave, { quantidade: Math.max(1, parseInt(e.target.value) || 1) })}
                      title={l.modo === 'cotas' ? 'Número de cotas' : 'Quantidade'}
                      className={`${inputCompacto} w-20`}
                    />
                  )}
                  <select
                    value={l.categoria}
                    onChange={(e) => alterar(l.chave, { categoria: e.target.value })}
                    className={`${inputCompacto} w-40`}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => remover(l)}
                    title="Tirar da lista"
                    className="p-2 rounded-lg hover:bg-error-light text-ink-soft hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-ink-muted flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            {linhas.filter((l) => l.imagem_url).length} de {linhas.length} com foto · total da lista:{' '}
            {formatarValor(
              linhas.reduce((s, l) => s + (l.modo === 'livre' ? l.valor : l.valor * l.quantidade), 0),
            )}
          </p>
        </>
      )}

      {erro && <p className="text-xs text-error">{erro}</p>}

      <div className="flex flex-wrap gap-3 pt-2">
        {linhas.length > 0 && (
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || enviandoAlguma}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : enviandoAlguma ? 'Aguarde as fotos...' : `Salvar ${linhas.length} presentes`}
          </button>
        )}
        <button
          type="button"
          onClick={cancelar}
          disabled={salvando}
          className="px-6 py-2.5 rounded-full bg-white border border-champagne-200 text-ink-soft hover:bg-champagne-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-champagne-100 bg-canvas text-ink focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100';

const inputCompacto =
  'px-3 py-2 rounded-lg border border-champagne-100 bg-canvas text-ink text-sm focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100';
