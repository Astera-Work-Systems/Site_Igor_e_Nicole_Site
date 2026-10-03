import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Gift,
  Ticket,
  TrendingUp,
  DollarSign,
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  ArrowLeft,
  Save,
  Receipt,
  Settings,
  LogOut,
  Loader2,
  HandHeart,
  MessageCircle,
  Shuffle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  ListPlus,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { CATEGORIAS, EVENT_DATA_TEXTO } from '@/data/mockData';
import { CONFIG_PADRAO, obterConfiguracoes } from '@/lib/api';
import * as admin from '@/lib/admin';
import { AdminPresentesEmLote } from '@/components/AdminPresentesEmLote';
import { formatarValor, formatarCupom, formatarDataHora } from '@/lib/utils/cupons';
import { disponibilidade, MODOS_PRESENTE } from '@/lib/utils/presentes';
import { linkWhatsAppConvidado } from '@/lib/utils/whatsapp';
import type {
  Configuracoes,
  Contribuicao,
  CupomSorteio,
  ModoPresente,
  Presente,
  PresenteEditavel,
  StatusContribuicao,
} from '@/types';

type AdminTab = 'dashboard' | 'presentes' | 'contribuicoes' | 'sorteio' | 'configuracoes';

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [ehAdmin, setEhAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregandoSessao(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Só verifica quando muda o USUÁRIO. O Supabase renova o login sozinho (ex.: ao voltar da
  // galeria de fotos no celular) e cada renovação gera uma sessão nova; checar de novo a cada
  // renovação fazia uma falha momentânea de rede derrubar o painel no meio da edição.
  const userId = session?.user.id;
  const [erroVerificacao, setErroVerificacao] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!userId) {
      setEhAdmin(null);
      return;
    }
    let ativo = true;
    setEhAdmin(null);
    setErroVerificacao(false);
    // Até 3 tentativas antes de desistir; erro de rede nunca vira "sem permissão".
    const verificar = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          const ok = await admin.souAdmin();
          if (ativo) setEhAdmin(ok);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
      }
      if (ativo) setErroVerificacao(true);
    };
    void verificar();
    return () => {
      ativo = false;
    };
  }, [userId, tentativa]);

  let conteudo: React.ReactNode;
  if (!supabase) {
    conteudo = (
      <Aviso titulo="Painel indisponível no modo demonstração">
        Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> para usar o painel.
      </Aviso>
    );
  } else if (session && ehAdmin === null && erroVerificacao) {
    conteudo = (
      <Aviso titulo="Não foi possível confirmar seu acesso">
        Parece um problema de conexão.{' '}
        <button onClick={() => setTentativa((t) => t + 1)} className="underline text-champagne-dark">
          Tentar de novo
        </button>
      </Aviso>
    );
  } else if (carregandoSessao || (session && ehAdmin === null)) {
    conteudo = (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-champagne animate-spin" />
      </div>
    );
  } else if (!session) {
    conteudo = <Login />;
  } else if (!ehAdmin) {
    conteudo = (
      <Aviso titulo="Sem permissão">
        Este usuário ({session.user.email}) não está cadastrado como administrador.{' '}
        <button onClick={admin.sair} className="underline text-champagne-dark">
          Sair
        </button>
      </Aviso>
    );
  } else {
    conteudo = <Painel />;
  }

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink">Painel Administrativo</h1>
            <p className="text-ink-muted text-sm mt-1">
              Gerencie presentes, acompanhe arrecadação e visualize cupons do sorteio
            </p>
          </div>
          <div className="flex gap-2">
            {session && (
              <button
                onClick={admin.sair}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-champagne-200 text-ink-soft text-sm font-medium hover:bg-champagne-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            )}
            <a
              href="#/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-champagne-200 text-ink-soft text-sm font-medium hover:bg-champagne-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </a>
          </div>
        </div>

        {conteudo}
      </div>
    </div>
  );
}

// ==================== LOGIN ====================

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEntrando(true);
    try {
      await admin.entrar(email, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEntrando(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto bg-white rounded-2xl border border-champagne-100 p-6 space-y-4"
    >
      <h3 className="font-serif text-lg text-ink">Entrar</h3>
      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1.5">E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1.5">Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputClass} />
      </div>
      {erro && <p className="text-xs text-error">{erro}</p>}
      <button
        type="submit"
        disabled={entrando}
        className="w-full py-2.5 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors disabled:opacity-60"
      >
        {entrando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

// ==================== PAINEL ====================

function Painel() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>([]);
  const [cupons, setCupons] = useState<CupomSorteio[]>([]);
  const [config, setConfig] = useState<Configuracoes>(CONFIG_PADRAO);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    try {
      const [p, c, cp, cfg] = await Promise.all([
        admin.listarPresentesAdmin(),
        admin.listarContribuicoes(),
        admin.listarCupons(),
        obterConfiguracoes(),
      ]);
      setPresentes(p);
      setContribuicoes(c);
      setCupons(cp);
      setConfig(cfg);
      setErro('');
    } catch {
      setErro('Não foi possível carregar os dados. Recarregue a página.');
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const confirmadas = contribuicoes.filter((c) => c.status === 'confirmado');
  const pagas = confirmadas.filter((c) => c.tipo === 'site');
  const totalArrecadado = pagas.reduce((acc, c) => acc + Number(c.valor), 0);
  const totalPessoalmente = confirmadas.filter((c) => c.tipo === 'pessoalmente').length;

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white rounded-2xl border border-champagne-100 p-2 overflow-x-auto">
        {[
          { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'presentes' as const, label: 'Presentes', icon: Gift },
          { id: 'contribuicoes' as const, label: 'Contribuições', icon: Receipt },
          { id: 'sorteio' as const, label: 'Sorteio', icon: Ticket },
          { id: 'configuracoes' as const, label: 'Configurações', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-champagne text-white shadow-sm' : 'text-ink-soft hover:bg-champagne-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {erro && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-error-light p-3 text-sm text-error">
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Total Arrecadado" value={formatarValor(totalArrecadado)} color="champagne" />
            <StatCard icon={Ticket} label="Cupons Gerados" value={String(cupons.length)} color="success" />
            <StatCard icon={TrendingUp} label="Pagamentos Confirmados" value={String(pagas.length)} color="champagne" />
            <StatCard icon={Users} label="Vão dar pessoalmente" value={String(totalPessoalmente)} color="ink" />
          </div>

          <div className="bg-white rounded-2xl border border-champagne-100 p-6">
            <h3 className="font-serif text-lg text-ink mb-4">Presentes mais populares</h3>
            <div className="space-y-3">
              {[...presentes]
                .sort((a, b) => disponibilidade(b).progresso - disponibilidade(a).progresso)
                .slice(0, 5)
                .map((p) => {
                  const d = disponibilidade(p);
                  return (
                    <div key={p.id} className="flex items-center gap-4">
                      <img src={p.imagem_url} alt={p.titulo} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{p.titulo}</p>
                        <div className="h-1.5 rounded-full bg-champagne-50 mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-champagne" style={{ width: `${d.progresso}%` }} />
                        </div>
                      </div>
                      <span className="text-sm text-ink-muted whitespace-nowrap">{d.resumo}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {tab === 'presentes' && <AbaPresentes presentes={presentes} onAlterado={recarregar} />}
      {tab === 'contribuicoes' && <AbaContribuicoes contribuicoes={contribuicoes} onAlterado={recarregar} />}
      {tab === 'sorteio' && <AbaSorteio cupons={cupons} />}
      {tab === 'configuracoes' && <AbaConfiguracoes config={config} onAlterado={recarregar} />}
    </>
  );
}

// ==================== PRESENTES ====================

function AbaPresentes({ presentes, onAlterado }: { presentes: Presente[]; onAlterado: () => void }) {
  const [editing, setEditing] = useState<Presente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLote, setShowLote] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const handleSave = async (p: PresenteEditavel) => {
    await admin.salvarPresente(p);
    setEditing(null);
    setShowForm(false);
    onAlterado();
  };

  const handleDelete = async (id: string) => {
    if (confirmarExclusao !== id) {
      setConfirmarExclusao(id);
      return;
    }
    setConfirmarExclusao(null);
    try {
      await admin.excluirPresente(id, presentes.find((p) => p.id === id)?.imagem_url);
      onAlterado();
    } catch {
      setErro('Não foi possível excluir. Tente desativar o presente.');
    }
  };

  const formulario = (
    <PresenteForm
      key={editing?.id ?? 'novo'}
      presente={editing}
      onSave={handleSave}
      onCancel={() => {
        setShowForm(false);
        setEditing(null);
      }}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-ink">Gerenciar Presentes</h3>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => {
              setShowForm(false);
              setEditing(null);
              setShowLote(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-champagne-200 text-ink-soft text-sm font-semibold hover:bg-champagne-50 transition-colors"
          >
            <ListPlus className="w-4 h-4" />
            Adicionar vários
          </button>
          <button
            onClick={() => {
              setShowLote(false);
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-champagne text-white text-sm font-semibold shadow-sm hover:bg-champagne-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo presente
          </button>
        </div>
      </div>

      {erro && <p className="text-sm text-error mb-4">{erro}</p>}

      {showLote && (
        <AdminPresentesEmLote
          onSalvo={() => {
            setShowLote(false);
            onAlterado();
          }}
          onCancel={() => setShowLote(false)}
        />
      )}

      {/* Novo presente abre no topo; a edição abre logo abaixo do presente clicado. */}
      {showForm && !editing && formulario}

      <div className="space-y-3">
        {presentes.map((p) => {
          const d = disponibilidade(p);
          return (
            <Fragment key={p.id}>
              <div
                className={`flex items-center gap-4 bg-white rounded-2xl border border-champagne-100 p-4 hover:shadow-sm transition-shadow ${
                  p.ativo ? '' : 'opacity-60'
                }`}
              >
                <img src={p.imagem_url} alt={p.titulo} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">
                    {p.titulo} {!p.ativo && <span className="text-xs text-ink-muted">(oculto)</span>}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {p.categoria} · {MODOS_PRESENTE[p.modo].nome} · {formatarValor(p.valor)} · {d.resumo}
                    {p.modo === 'inteiro' && p.permite_pessoalmente && ' · aceita pessoalmente'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowLote(false);
                      setEditing(p);
                      setShowForm(true);
                    }}
                    className="p-2 rounded-lg hover:bg-champagne-50 text-ink-soft hover:text-champagne transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    onBlur={() => setConfirmarExclusao(null)}
                    className="p-2 rounded-lg hover:bg-error-light text-ink-soft hover:text-error transition-colors text-xs font-medium"
                  >
                    {confirmarExclusao === p.id ? 'Confirmar?' : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {showForm && editing?.id === p.id && formulario}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function PresenteForm({
  presente,
  onSave,
  onCancel,
}: {
  presente: Presente | null;
  onSave: (p: PresenteEditavel) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PresenteEditavel>(
    presente || {
      id: '',
      titulo: '',
      categoria: CATEGORIAS[0],
      imagem_url: '',
      modo: 'inteiro',
      valor: 0,
      quantidade_total: 1,
      valor_minimo: null,
      permite_pessoalmente: true,
      ativo: true,
    },
  );
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [imagemQuebrada, setImagemQuebrada] = useState(false);
  // Fotos enviadas nesta edição: as que não ficarem no presente são apagadas do Storage.
  const enviadas = useRef<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState('');

  // Garante que o formulário apareça na tela, mesmo editando um presente lá embaixo da lista.
  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const temContribuicoes = presente ? presente.quantidade_ocupada > 0 || presente.valor_ocupado > 0 : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || form.valor <= 0 || !form.imagem_url.trim()) {
      setErro('Preencha título, valor e imagem.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await onSave(form);
      const sobras = enviadas.current.filter((u) => u !== form.imagem_url);
      if (presente && presente.imagem_url !== form.imagem_url) sobras.push(presente.imagem_url);
      sobras.forEach((u) => void admin.removerImagemPresente(u));
    } catch {
      setErro('Não foi possível salvar.');
      setSalvando(false);
    }
  };

  const handleCancel = () => {
    enviadas.current.forEach((u) => void admin.removerImagemPresente(u));
    onCancel();
  };

  const handleArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setEnviandoImagem(true);
    setErro('');
    try {
      const url = await admin.enviarImagemPresente(arquivo);
      enviadas.current.push(url);
      setImagemQuebrada(false);
      setForm((f) => ({ ...f, imagem_url: url }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar a imagem.');
    } finally {
      setEnviandoImagem(false);
    }
  };

  const rotuloValor = { inteiro: 'Valor de 1 unidade (R$)', cotas: 'Valor de cada cota (R$)', livre: 'Meta total (R$)' }[
    form.modo
  ];

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-champagne-100 p-6 mb-6 space-y-4 scroll-mt-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-serif text-lg text-ink">{presente ? 'Editar presente' : 'Novo presente'}</h4>
        <button type="button" onClick={handleCancel} className="p-1.5 rounded-full hover:bg-champagne-50">
          <X className="w-5 h-5 text-ink-soft" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className={inputClass}
          >
            {(CATEGORIAS.includes(form.categoria) ? CATEGORIAS : [...CATEGORIAS, form.categoria]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modo */}
      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1.5">Como o presente é dado</label>
        <div className="grid sm:grid-cols-3 gap-2">
          {(Object.keys(MODOS_PRESENTE) as ModoPresente[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setForm({ ...form, modo: m })}
              className={`text-left p-3 rounded-xl border transition-all ${
                form.modo === m
                  ? 'border-champagne bg-champagne-50 ring-2 ring-champagne-100'
                  : 'border-champagne-100 hover:bg-champagne-50'
              }`}
            >
              <p className="text-sm font-semibold text-ink">{MODOS_PRESENTE[m].nome}</p>
              <p className="text-xs text-ink-muted mt-0.5">{MODOS_PRESENTE[m].descricao}</p>
            </button>
          ))}
        </div>
        {temContribuicoes && form.modo !== presente?.modo && (
          <p className="text-xs text-error mt-2">
            Atenção: este presente já recebeu contribuições. Mudar o modo pode deixar a contagem estranha.
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">{rotuloValor}</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.valor || ''}
            onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
            className={inputClass}
          />
        </div>
        {form.modo !== 'livre' ? (
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">
              {form.modo === 'cotas' ? 'Número de cotas' : 'Quantas unidades vocês querem'}
            </label>
            <input
              type="number"
              min="1"
              value={form.quantidade_total}
              onChange={(e) => setForm({ ...form, quantidade_total: parseInt(e.target.value) || 1 })}
              className={inputClass}
            />
            {form.modo === 'cotas' && form.valor > 0 && (
              <p className="text-xs text-ink-muted mt-1">
                Total do presente: {formatarValor(form.valor * form.quantidade_total)}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">Valor mínimo por pessoa (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.valor_minimo ?? ''}
              onChange={(e) => setForm({ ...form, valor_minimo: parseFloat(e.target.value) || null })}
              placeholder="0,01"
              className={inputClass}
            />
            <p className="text-xs text-ink-muted mt-1">Em branco = qualquer valor a partir de R$ 0,01.</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1.5">Imagem</label>
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 flex-shrink-0 rounded-xl border border-champagne-100 bg-champagne-50 overflow-hidden flex items-center justify-center">
            {enviandoImagem ? (
              <Loader2 className="w-6 h-6 text-champagne animate-spin" />
            ) : form.imagem_url && !imagemQuebrada ? (
              <img
                src={form.imagem_url}
                alt=""
                onError={() => setImagemQuebrada(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-ink-muted" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-champagne-200 text-sm text-ink-soft hover:bg-champagne-50 transition-colors cursor-pointer ${
                enviandoImagem ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <Upload className="w-4 h-4" />
              {enviandoImagem ? 'Compactando e enviando...' : 'Enviar foto do computador/celular'}
              <input type="file" accept="image/*" onChange={handleArquivo} className="hidden" />
            </label>
            <p className="text-xs text-ink-muted">A foto é compactada automaticamente (fica com poucos KB).</p>
            <input
              type="text"
              value={form.imagem_url}
              onChange={(e) => {
                setImagemQuebrada(false);
                setForm({ ...form, imagem_url: e.target.value });
              }}
              placeholder="ou cole o link direto da imagem (https://...)"
              className={inputClass}
            />
            {imagemQuebrada && (
              <p className="text-xs text-error">
                Esse link não abriu como imagem (o site pode bloquear). Salve a foto no aparelho e use "Enviar foto".
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {form.modo === 'inteiro' && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.permite_pessoalmente}
              onChange={(e) => setForm({ ...form, permite_pessoalmente: e.target.checked })}
              className="accent-champagne"
            />
            Aceita "Vou dar pessoalmente" (recomendado só para presentes menores)
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            className="accent-champagne"
          />
          Visível na vitrine
        </label>
      </div>

      {erro && <p className="text-xs text-error">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2.5 rounded-full bg-white border border-champagne-200 text-ink-soft hover:bg-champagne-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ==================== CONTRIBUIÇÕES ====================

type FiltroContribuicao = 'todas' | 'confirmado' | 'pendente' | 'pessoalmente' | 'cancelado';

const STATUS_ESTILO: Record<StatusContribuicao, string> = {
  confirmado: 'bg-success-light text-success',
  pendente: 'bg-champagne-50 text-champagne-dark',
  cancelado: 'bg-gray-100 text-ink-muted',
};

function AbaContribuicoes({ contribuicoes, onAlterado }: { contribuicoes: Contribuicao[]; onAlterado: () => void }) {
  const [filtro, setFiltro] = useState<FiltroContribuicao>('todas');
  const [confirmarCancelamento, setConfirmarCancelamento] = useState<string | null>(null);

  const lista = contribuicoes.filter((c) => {
    if (filtro === 'todas') return true;
    if (filtro === 'pessoalmente') return c.tipo === 'pessoalmente' && c.status === 'confirmado';
    return c.status === filtro;
  });

  const handleCancelar = async (id: string) => {
    if (confirmarCancelamento !== id) {
      setConfirmarCancelamento(id);
      return;
    }
    setConfirmarCancelamento(null);
    await admin.cancelarContribuicao(id);
    onAlterado();
  };

  const filtros: { id: FiltroContribuicao; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'confirmado', label: 'Confirmadas' },
    { id: 'pendente', label: 'Aguardando pagamento' },
    { id: 'pessoalmente', label: 'Vão dar pessoalmente' },
    { id: 'cancelado', label: 'Canceladas' },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filtro === f.id
                ? 'bg-ink text-white shadow-sm'
                : 'bg-white border border-champagne-100 text-ink-soft hover:bg-champagne-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="text-center text-ink-muted py-12">Nenhuma contribuição aqui ainda.</p>
      ) : (
        <div className="space-y-3">
          {lista.map((c) => {
            const podeCancelar = c.status === 'pendente' || (c.status === 'confirmado' && c.tipo === 'pessoalmente');
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-champagne-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {c.nome_convidado}{' '}
                      <a
                        href={linkWhatsAppConvidado(c.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-champagne-dark hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> {c.whatsapp}
                      </a>
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {c.presente_titulo}
                      {c.quantidade > 1 && ` · ${c.quantidade}×`} · {formatarDataHora(c.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg text-champagne-dark">{formatarValor(Number(c.valor))}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-champagne-50 text-ink-soft inline-flex items-center gap-1">
                      {c.tipo === 'pessoalmente' ? (
                        <>
                          <HandHeart className="w-3.5 h-3.5" /> Pessoalmente
                        </>
                      ) : c.forma_pagamento === 'pix' ? (
                        'Pix'
                      ) : (
                        'Cartão'
                      )}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_ESTILO[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                {c.mensagem && <p className="text-sm text-ink-soft italic mt-2">"{c.mensagem}"</p>}
                {podeCancelar && (
                  <button
                    onClick={() => handleCancelar(c.id)}
                    onBlur={() => setConfirmarCancelamento(null)}
                    className="mt-3 text-xs font-medium text-error hover:underline"
                  >
                    {confirmarCancelamento === c.id
                      ? 'Clique de novo para confirmar — o item volta para a lista'
                      : c.tipo === 'pessoalmente'
                        ? 'Cancelar reserva (a pessoa desistiu)'
                        : 'Cancelar e liberar a cota'}
                  </button>
                )}
                {c.status === 'confirmado' && c.tipo === 'site' && (
                  <p className="mt-3 text-xs text-ink-muted">
                    Para devolver o dinheiro, faça o estorno no painel do Asaas — o site atualiza sozinho.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== SORTEIO ====================

function AbaSorteio({ cupons }: { cupons: CupomSorteio[] }) {
  const [sorteado, setSorteado] = useState<CupomSorteio | null>(null);

  const sortear = () => {
    if (cupons.length === 0) return;
    const aleatorio = new Uint32Array(1);
    crypto.getRandomValues(aleatorio);
    setSorteado(cupons[aleatorio[0] % cupons.length]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-champagne-100 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-champagne-50 border border-champagne-100 mb-4">
          <Ticket className="w-8 h-8 text-champagne" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-xl text-ink mb-2">Sorteio do Chá de Panela</h3>
        <p className="text-ink-muted text-sm max-w-md mx-auto mb-6">
          Total de <strong className="text-champagne-dark">{cupons.length} cupons</strong> gerados
          até agora. O sorteio acontece presencialmente no dia {EVENT_DATA_TEXTO}.
        </p>
        <button
          onClick={sortear}
          disabled={cupons.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors disabled:opacity-50"
        >
          <Shuffle className="w-4 h-4" /> Sortear um número
        </button>
        {sorteado && (
          <div className="mt-6 animate-scale-in">
            <p className="font-serif text-4xl text-champagne-dark">{formatarCupom(sorteado.numero_cupom)}</p>
            <p className="text-ink mt-1">{sorteado.nome_convidado}</p>
            <p className="text-xs text-ink-muted">{sorteado.whatsapp}</p>
          </div>
        )}
      </div>

      {cupons.length > 0 && (
        <div className="bg-white rounded-2xl border border-champagne-100 p-6">
          <h3 className="font-serif text-lg text-ink mb-4">Todos os números</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {cupons.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-xl bg-champagne-50 border border-champagne-100 px-3 py-2">
                <span className="font-serif text-champagne-dark">{formatarCupom(c.numero_cupom)}</span>
                <span className="text-xs text-ink-soft truncate">{c.nome_convidado}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CONFIGURAÇÕES ====================

function AbaConfiguracoes({ config, onAlterado }: { config: Configuracoes; onAlterado: () => void }) {
  const [form, setForm] = useState(config);
  const [status, setStatus] = useState<'' | 'salvando' | 'salvo' | 'erro'>('');

  useEffect(() => setForm(config), [config]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('salvando');
    try {
      await admin.salvarConfiguracoes(form);
      setStatus('salvo');
      onAlterado();
    } catch {
      setStatus('erro');
    }
  };

  return (
    <form onSubmit={salvar} className="bg-white rounded-2xl border border-champagne-100 p-6 space-y-5 max-w-2xl">
      <h3 className="font-serif text-lg text-ink">Regras do site</h3>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={form.cupom_pessoalmente}
          onChange={(e) => setForm({ ...form, cupom_pessoalmente: e.target.checked })}
          className="accent-champagne mt-1"
        />
        <span>
          <strong className="text-ink">Quem dá pessoalmente também ganha número da sorte</strong>
          <br />
          <span className="text-xs text-ink-muted">
            Desligado: só presentes pagos pelo site geram números. Vale para as novas reservas.
          </span>
        </span>
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">1 número da sorte a cada (R$)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={form.valor_por_cupom}
            onChange={(e) => setForm({ ...form, valor_por_cupom: parseFloat(e.target.value) || 50 })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">Reserva durante o pagamento (minutos)</label>
          <input
            type="number"
            min="5"
            max="1440"
            value={form.minutos_reserva}
            onChange={(e) => setForm({ ...form, minutos_reserva: parseInt(e.target.value) || 30 })}
            className={inputClass}
          />
          <p className="text-xs text-ink-muted mt-1">
            Tempo que a cota fica segura enquanto o convidado paga.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'salvando'}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {status === 'salvando' ? 'Salvando...' : 'Salvar'}
        </button>
        {status === 'salvo' && <span className="text-sm text-success">Salvo!</span>}
        {status === 'erro' && <span className="text-sm text-error">Não foi possível salvar.</span>}
      </div>
    </form>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-champagne-100 bg-canvas text-ink focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100';

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-champagne-100 p-8 text-center max-w-lg mx-auto">
      <h3 className="font-serif text-xl text-ink mb-2">{titulo}</h3>
      <p className="text-ink-muted text-sm">{children}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'champagne' | 'success' | 'ink';
}) {
  const colorMap = {
    champagne: 'bg-champagne-50 text-champagne border-champagne-100',
    success: 'bg-success-light text-success border-success/10',
    ink: 'bg-ink/5 text-ink border-ink/10',
  };
  return (
    <div className="bg-white rounded-2xl border border-champagne-100 p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className="font-serif text-xl text-ink">{value}</p>
    </div>
  );
}
