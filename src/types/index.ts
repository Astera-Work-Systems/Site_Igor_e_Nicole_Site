export interface Presente {
  id: string;
  titulo: string;
  categoria: string;
  imagem_url: string;
  valor: number;
  quantidade_total: number;
  quantidade_comprada: number;
  ativo: boolean;
}

export interface Transacao {
  id: string;
  presente_id: string;
  presente_titulo: string;
  nome_convidado: string;
  whatsapp: string;
  mensagem: string;
  valor_pago: number;
  status_pagamento: 'pending' | 'approved' | 'rejected';
  pix_id_mercadopago: string;
  created_at: string;
}

export interface CupomSorteio {
  id: string;
  transacao_id: string;
  nome_convidado: string;
  whatsapp: string;
  numero_cupom: number;
  created_at: string;
}

export interface Recado {
  id: string;
  nome_convidado: string;
  mensagem: string;
  presente_titulo: string;
  created_at: string;
}

export type CheckoutStep = 'dados' | 'pagamento' | 'sucesso';
export type FiltroPresente = 'todos' | 'ate100' | '100a300' | 'grandes';
