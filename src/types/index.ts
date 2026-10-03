/**
 * Cada convidado dá o presente inteiro (sem cotas nem vaquinha; os caros podem ser parcelados no cartão).
 * `valor` = preço de 1 unidade, `quantidade_total` = unidades desejadas.
 */
export interface Presente {
  id: string;
  titulo: string;
  categoria: string;
  imagem_url: string;
  valor: number;
  quantidade_total: number;
  permite_pessoalmente: boolean;
  ativo: boolean;
  /** Calculado no banco (view presentes_vitrine): confirmados + pagamentos pendentes no prazo. */
  quantidade_ocupada: number;
}

export type PresenteEditavel = Omit<Presente, 'quantidade_ocupada'>;

export type TipoContribuicao = 'site' | 'pessoalmente';
export type FormaPagamento = 'pix' | 'cartao';
export type StatusContribuicao = 'pendente' | 'confirmado' | 'cancelado';

export interface Contribuicao {
  id: string;
  presente_id: string | null;
  presente_titulo: string;
  tipo: TipoContribuicao;
  forma_pagamento: FormaPagamento | null;
  status: StatusContribuicao;
  quantidade: number;
  valor: number;
  /** Parcelas no cartão (1 = à vista). */
  parcelas: number;
  nome_convidado: string;
  whatsapp: string;
  mensagem: string | null;
  asaas_payment_id: string | null;
  asaas_invoice_url: string | null;
  expira_em: string | null;
  confirmado_em: string | null;
  created_at: string;
}

export interface CupomSorteio {
  id: string;
  contribuicao_id: string;
  nome_convidado: string;
  whatsapp: string;
  numero_cupom: number;
  created_at: string;
}

export interface Recado {
  id: string;
  nome_convidado: string;
  mensagem: string;
  presente_titulo: string | null;
  created_at: string;
}

export interface Configuracoes {
  cupom_pessoalmente: boolean;
  valor_por_cupom: number;
  minutos_reserva: number;
  /** Máximo de parcelas no cartão (1 = só à vista). */
  max_parcelas: number;
}

export type CheckoutStep = 'dados' | 'pagamento' | 'sucesso';
export type FiltroPresente = 'todos' | 'ate100' | '100a300' | 'acima300';
