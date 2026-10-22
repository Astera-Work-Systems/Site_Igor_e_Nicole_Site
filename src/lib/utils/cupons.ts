/**
 * Quantidade de números da sorte: cada unidade do presente vale 1 número, mais 1 a cada
 * `valorPorCupom` (configurável no painel) do valor dela. Ex.: R$ 30 → 1, R$ 50 → 2, R$ 100 → 3.
 * A geração oficial acontece no banco (cupons_por_regra); aqui é só a prévia na tela.
 */
export function calcularCupons(valorUnitario: number, quantidade: number = 1, valorPorCupom: number = 50): number {
  return quantidade * (1 + Math.floor(valorUnitario / valorPorCupom));
}

/**
 * Formata um valor numérico em reais (R$ XX,XX).
 */
export function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata o número da sorte com zeros à esquerda (ex: 42 → #042).
 */
export function formatarCupom(numero: number): string {
  return `#${String(numero).padStart(3, '0')}`;
}

/**
 * Formata uma data ISO em string legível em português.
 */
export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
