import type { Presente } from '@/types';

export interface Disponibilidade {
  esgotado: boolean;
  /** 0–100 */
  progresso: number;
  /** unidades restantes */
  restanteQtd: number;
  resumo: string;
  restanteTexto: string;
}

/** O Asaas não emite cobrança (Pix ou cartão) abaixo de R$ 5,00. "Pessoalmente" não tem mínimo. */
export const VALOR_MINIMO_PAGAMENTO = 5;

/** No parcelado, cada parcela também precisa ter pelo menos R$ 5,00 (regra do Asaas). */
export function parcelasPermitidas(valorTotal: number, maxParcelas: number): number {
  return Math.max(1, Math.min(maxParcelas, Math.floor(valorTotal / VALOR_MINIMO_PAGAMENTO)));
}

export function disponibilidade(p: Presente): Disponibilidade {
  const restanteQtd = Math.max(0, p.quantidade_total - p.quantidade_ocupada);
  const unidade = p.quantidade_total > 1 ? 'unidades' : 'unidade';
  return {
    esgotado: restanteQtd <= 0,
    progresso: Math.min(100, (p.quantidade_ocupada / p.quantidade_total) * 100),
    restanteQtd,
    resumo: `${p.quantidade_ocupada} de ${p.quantidade_total} ${unidade}`,
    restanteTexto: `${restanteQtd} ${restanteQtd === 1 ? 'restante' : 'restantes'}`,
  };
}
