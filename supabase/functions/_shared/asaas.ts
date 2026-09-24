/**
 * Cliente mínimo da API do Asaas (v3).
 *
 * Variáveis de ambiente (configure com `supabase secrets set NOME=valor`):
 *  - ASAAS_API_KEY            chave da conta que EMITE as cobranças
 *  - ASAAS_BASE_URL           https://api-sandbox.asaas.com/v3 (testes) ou https://api.asaas.com/v3 (produção)
 *  - ASAAS_WEBHOOK_TOKEN      token que você define ao cadastrar o webhook no painel do Asaas
 *
 * ── SPLIT (duas contas, 50% para cada) ─────────────────────────────────────────
 *  - ASAAS_SPLIT_WALLET_ID    walletId da SEGUNDA conta (Asaas > Integrações > Carteira).
 *                             Vazio/ausente = tudo fica na conta da ASAAS_API_KEY.
 *  - ASAAS_SPLIT_PERCENTUAL   % que vai para a segunda conta (padrão 50).
 *  O Asaas aplica o percentual sobre o valor LÍQUIDO (já descontadas as taxas).
 */

const API_KEY = Deno.env.get('ASAAS_API_KEY') ?? '';
const BASE_URL = (Deno.env.get('ASAAS_BASE_URL') ?? 'https://api-sandbox.asaas.com/v3').replace(/\/$/, '');
const SPLIT_WALLET_ID = (Deno.env.get('ASAAS_SPLIT_WALLET_ID') ?? '').trim();
const SPLIT_PERCENTUAL = Number(Deno.env.get('ASAAS_SPLIT_PERCENTUAL') ?? '50');

export type AsaasStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

export interface AsaasPayment {
  id: string;
  status: AsaasStatus;
  value: number;
  invoiceUrl: string;
  externalReference: string | null;
  deleted?: boolean;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

async function asaas<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_KEY) throw new Error('ASAAS_API_KEY não configurada.');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'site-igor-e-nicole',
      access_token: API_KEY,
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalhe = body?.errors?.map((e: { description: string }) => e.description).join('; ');
    throw new Error(`Asaas ${res.status} em ${path}: ${detalhe || JSON.stringify(body)}`);
  }
  return body as T;
}

/** Regras de divisão aplicadas em TODA cobrança. Para ligar o 50/50, basta definir ASAAS_SPLIT_WALLET_ID. */
export function montarSplit() {
  if (!SPLIT_WALLET_ID) return undefined;
  return [{ walletId: SPLIT_WALLET_ID, percentualValue: SPLIT_PERCENTUAL }];
}

export async function obterOuCriarCliente(dados: {
  nome: string;
  cpf: string;
  whatsapp: string;
}): Promise<string> {
  const busca = await asaas<{ data: { id: string }[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(dados.cpf)}&limit=1`,
  );
  if (busca.data.length > 0) return busca.data[0].id;

  const cliente = await asaas<{ id: string }>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: dados.nome,
      cpfCnpj: dados.cpf,
      mobilePhone: dados.whatsapp,
      // Não queremos que o Asaas mande e-mail/SMS de cobrança para os convidados.
      notificationDisabled: true,
    }),
  });
  return cliente.id;
}

export function criarCobranca(dados: {
  clienteId: string;
  forma: 'pix' | 'cartao';
  valor: number;
  descricao: string;
  referencia: string;
}): Promise<AsaasPayment> {
  return asaas<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: dados.clienteId,
      billingType: dados.forma === 'pix' ? 'PIX' : 'CREDIT_CARD',
      value: dados.valor,
      dueDate: amanhaEmBrasilia(),
      description: dados.descricao,
      externalReference: dados.referencia,
      split: montarSplit(),
    }),
  });
}

export function obterCobranca(id: string): Promise<AsaasPayment> {
  return asaas<AsaasPayment>(`/payments/${encodeURIComponent(id)}`);
}

export function obterPixQrCode(id: string): Promise<AsaasPixQrCode> {
  return asaas<AsaasPixQrCode>(`/payments/${encodeURIComponent(id)}/pixQrCode`);
}

export function excluirCobranca(id: string): Promise<unknown> {
  return asaas(`/payments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Dinheiro entrou (Pix recebido ou cartão aprovado). */
export function statusPago(s: AsaasStatus): boolean {
  return s === 'RECEIVED' || s === 'CONFIRMED' || s === 'RECEIVED_IN_CASH';
}

/** Dinheiro voltou ou nunca vai entrar: libera a cota. */
export function statusPerdido(p: AsaasPayment): boolean {
  return (
    p.deleted === true ||
    p.status === 'OVERDUE' ||
    p.status === 'REFUNDED' ||
    p.status === 'REFUND_REQUESTED' ||
    p.status === 'REFUND_IN_PROGRESS' ||
    p.status === 'CHARGEBACK_REQUESTED'
  );
}

function amanhaEmBrasilia(): string {
  const agora = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}
