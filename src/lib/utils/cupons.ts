/**
 * Quantidade de números da sorte para um valor: 1 a cada `valorPorCupom` (configurável no painel).
 * A geração oficial acontece no banco (confirmar_contribuicao); aqui é só a prévia na tela.
 */
export function calcularCupons(valor: number, valorPorCupom: number = 50): number {
  return Math.floor(valor / valorPorCupom);
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
