import { useState } from 'react';
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
} from 'lucide-react';
import { mockPresentes } from '@/data/mockData';
import { formatarValor, calcularCupons, gerarId } from '@/lib/utils/cupons';
import type { Presente } from '@/types';

type AdminTab = 'dashboard' | 'presentes' | 'sorteio';

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [presentes, setPresentes] = useState<Presente[]>(mockPresentes);
  const [editing, setEditing] = useState<Presente | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Stats
  const totalArrecadado = presentes.reduce(
    (acc, p) => acc + p.valor * p.quantidade_comprada,
    0,
  );
  const totalCupons = presentes.reduce(
    (acc, p) => acc + calcularCupons(p.valor) * p.quantidade_comprada,
    0,
  );
  const totalVendidos = presentes.reduce((acc, p) => acc + p.quantidade_comprada, 0);
  const totalDisponiveis = presentes.reduce(
    (acc, p) => acc + (p.quantidade_total - p.quantidade_comprada),
    0,
  );

  const handleSave = (presente: Presente) => {
    if (editing) {
      setPresentes(presentes.map((p) => (p.id === presente.id ? presente : p)));
    } else {
      setPresentes([...presentes, { ...presente, id: gerarId() }]);
    }
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setPresentes(presentes.filter((p) => p.id !== id));
  };

  const handleEdit = (p: Presente) => {
    setEditing(p);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setShowForm(true);
  };

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
          <a
            href="#/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-champagne-200 text-ink-soft text-sm font-medium hover:bg-champagne-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl border border-champagne-100 p-2">
          {[
            { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
            { id: 'presentes' as const, label: 'Presentes', icon: Gift },
            { id: 'sorteio' as const, label: 'Sorteio', icon: Ticket },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-champagne text-white shadow-sm'
                    : 'text-ink-soft hover:bg-champagne-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={DollarSign}
                label="Total Arrecadado"
                value={formatarValor(totalArrecadado)}
                color="champagne"
              />
              <StatCard
                icon={Ticket}
                label="Cupons Gerados"
                value={String(totalCupons)}
                color="success"
              />
              <StatCard
                icon={TrendingUp}
                label="Cotas Vendidas"
                value={String(totalVendidos)}
                color="champagne"
              />
              <StatCard
                icon={Users}
                label="Cotas Disponíveis"
                value={String(totalDisponiveis)}
                color="ink"
              />
            </div>

            {/* Tabela de presentes mais vendidos */}
            <div className="bg-white rounded-2xl border border-champagne-100 p-6">
              <h3 className="font-serif text-lg text-ink mb-4">Presentes mais populares</h3>
              <div className="space-y-3">
                {[...presentes]
                  .sort((a, b) => b.quantidade_comprada - a.quantidade_comprada)
                  .slice(0, 5)
                  .map((p) => {
                    const pct = (p.quantidade_comprada / p.quantidade_total) * 100;
                    return (
                      <div key={p.id} className="flex items-center gap-4">
                        <img src={p.imagem_url} alt={p.titulo} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{p.titulo}</p>
                          <div className="h-1.5 rounded-full bg-champagne-50 mt-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-champagne" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-sm text-ink-muted whitespace-nowrap">
                          {p.quantidade_comprada}/{p.quantidade_total}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Presentes CRUD */}
        {tab === 'presentes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-ink">Gerenciar Presentes</h3>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-champagne text-white text-sm font-semibold shadow-sm hover:bg-champagne-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo presente
              </button>
            </div>

            {showForm && (
              <PresenteForm
                presente={editing}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            )}

            <div className="space-y-3">
              {presentes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-champagne-100 p-4 hover:shadow-sm transition-shadow"
                >
                  <img src={p.imagem_url} alt={p.titulo} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{p.titulo}</p>
                    <p className="text-xs text-ink-muted">
                      {p.categoria} · {formatarValor(p.valor)} · {p.quantidade_comprada}/{p.quantidade_total} cotas
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-2 rounded-lg hover:bg-champagne-50 text-ink-soft hover:text-champagne transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg hover:bg-error-light text-ink-soft hover:text-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sorteio */}
        {tab === 'sorteio' && (
          <div className="bg-white rounded-2xl border border-champagne-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-champagne-50 border border-champagne-100 mb-4">
              <Ticket className="w-8 h-8 text-champagne" strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xl text-ink mb-2">Sorteio do Chá de Panela</h3>
            <p className="text-ink-muted text-sm max-w-md mx-auto mb-6">
              Total de <strong className="text-champagne-dark">{totalCupons} cupons</strong> gerados
              até agora. O sorteio acontece presencialmente no dia 10 de Abril de 2027.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square flex items-center justify-center rounded-xl bg-champagne-50 border border-champagne-100 font-serif text-lg text-champagne-dark"
                >
                  #{String(totalCupons > 0 ? Math.floor(Math.random() * totalCupons) + 1 : 0).padStart(3, '0')}
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-muted mt-4">
              Preview ilustrativo dos cupons. O sorteio oficial é presencial.
            </p>
          </div>
        )}
      </div>
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

function PresenteForm({
  presente,
  onSave,
  onCancel,
}: {
  presente: Presente | null;
  onSave: (p: Presente) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Presente>(
    presente || {
      id: '',
      titulo: '',
      categoria: 'Cozinha',
      imagem_url: '',
      valor: 0,
      quantidade_total: 1,
      quantidade_comprada: 0,
      ativo: true,
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.titulo.trim() && form.valor > 0) {
      onSave(form);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-champagne-100 p-6 mb-6 space-y-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-serif text-lg text-ink">
          {presente ? 'Editar presente' : 'Novo presente'}
        </h4>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-full hover:bg-champagne-50">
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
            className="w-full px-4 py-2.5 rounded-xl border border-champagne-100 bg-canvas text-ink focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-champagne-100 bg-canvas text-ink focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100"
          >
            {['Cozinha', 'Eletrodomésticos', 'Mesa Posta', 'Cama & Banho', 'Cotas Grandes'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-champagne-100 bg-canvas text-ink focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-soft mb-1.5">Quantidade total</label>
          <input
            type="number"
            value={form.quantidade_total}
            onChange={(e) => setForm({ ...form, quantidade_total: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-2.5 rounded-xl border border-champagne-100 bg-canvas text-ink focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1.5">URL da imagem</label>
        <input
          type="text"
          value={form.imagem_url}
          onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-xl border border-champagne-100 bg-canvas text-ink focus:outline-none focus:ring-2 focus:border-champagne focus:ring-champagne-100"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-champagne text-white font-semibold shadow-sm hover:bg-champagne-dark transition-colors"
        >
          <Save className="w-4 h-4" />
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-full bg-white border border-champagne-200 text-ink-soft hover:bg-champagne-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
