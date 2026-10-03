import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { mockPresentes, mockRecados } from '@/data/mockData';
import type {
  Configuracoes,
  FormaPagamento,
  Presente,
  Recado,
  StatusContribuicao,
  TipoContribuicao,
} from '@/types';

/**
 * Tudo que o site público lê/escreve passa por aqui.
 * Sem Supabase configurado (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY), roda em modo demonstração com mocks.
 */

export const CONFIG_PADRAO: Configuracoes = {
  cupom_pessoalmente: false,
  valor_por_cupom: 50,
  minutos_reserva: 30,
  max_parcelas: 12,
};

export async function listarPresentes(): Promise<Presente[]> {
  if (!supabase) return mockPresentes;
  const { data, error } = await supabase
    .from('presentes_vitrine')
    .select('*')
    .eq('ativo', true)
    .order('created_at');
  if (error) throw error;
  return data as Presente[];
}

export async function listarRecados(): Promise<Recado[]> {
  if (!supabase) return mockRecados;
  const { data, error } = await supabase
    .from('recados')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return data as Recado[];
}

export async function criarRecado(nome: string, mensagem: string): Promise<Recado> {
  const novo = { nome_convidado: nome.trim(), mensagem: mensagem.trim(), presente_titulo: 'Mensagem de carinho' };
  if (!supabase) return { ...novo, id: `r${Date.now()}`, created_at: new Date().toISOString() };
  const { data, error } = await supabase.from('recados').insert(novo).select().single();
  if (error) throw error;
  return data as Recado;
}

export async function obterConfiguracoes(): Promise<Configuracoes> {
  if (!supabase) return CONFIG_PADRAO;
  const { data } = await supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle();
  return (data as Configuracoes | null) ?? CONFIG_PADRAO;
}

// ==================== Contribuições (Edge Functions) ====================

export interface NovaContribuicao {
  presente_id: string;
  tipo: TipoContribuicao;
  forma_pagamento?: FormaPagamento;
  quantidade?: number;
  /** Só no cartão; 1 = à vista. */
  parcelas?: number;
  nome: string;
  whatsapp: string;
  cpf?: string;
  mensagem?: string;
}

export interface RespostaContribuicao {
  id: string;
  status: StatusContribuicao;
  cupons?: number[];
  valor?: number;
  expira_em?: string;
  invoice_url?: string;
  pix?: { copia_e_cola: string; qr_code_base64: string } | null;
}

export async function criarContribuicao(entrada: NovaContribuicao): Promise<RespostaContribuicao> {
  if (!supabase) return mock.criar(entrada);
  return chamarFuncao<RespostaContribuicao>('criar-contribuicao', entrada);
}

export async function consultarContribuicao(id: string): Promise<{ status: StatusContribuicao; cupons: number[] }> {
  if (!supabase) return mock.consultar(id);
  return chamarFuncao('status-contribuicao', { id });
}

async function chamarFuncao<T>(nome: string, body: object): Promise<T> {
  const { data, error } = await supabase!.functions.invoke(nome, { body: body as Record<string, unknown> });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const corpo = await error.context.json().catch(() => null);
      throw new Error(corpo?.erro ?? 'Algo deu errado. Tente novamente.');
    }
    throw new Error('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
  }
  return data as T;
}

// ==================== Modo demonstração ====================

const mock = (() => {
  const criadas = new Map<string, { em: number; cupons: number[] }>();
  let proximoCupom = 42;

  return {
    async criar(e: NovaContribuicao): Promise<RespostaContribuicao> {
      await new Promise((r) => setTimeout(r, 1200));
      const presente = mockPresentes.find((p) => p.id === e.presente_id)!;
      const valor = presente.valor * (e.quantidade ?? 1);
      const deveGerar = e.tipo === 'site' || CONFIG_PADRAO.cupom_pessoalmente;
      const cupons = Array.from(
        { length: deveGerar ? Math.floor(valor / CONFIG_PADRAO.valor_por_cupom) : 0 },
        () => proximoCupom++,
      );
      const id = crypto.randomUUID();
      criadas.set(id, { em: Date.now(), cupons });

      if (e.tipo === 'pessoalmente') return { id, status: 'confirmado', cupons };
      return {
        id,
        status: 'pendente',
        valor,
        invoice_url: 'https://www.asaas.com',
        pix:
          e.forma_pagamento === 'pix'
            ? { copia_e_cola: `00020126580014BR.GOV.BCB.PIX-DEMONSTRACAO-${id.slice(0, 8)}`, qr_code_base64: '' }
            : null,
      };
    },
    async consultar(id: string) {
      const c = criadas.get(id);
      const pago = c && Date.now() - c.em > 8000;
      return { status: (pago ? 'confirmado' : 'pendente') as StatusContribuicao, cupons: pago ? c.cupons : [] };
    },
  };
})();
