/**
 * Calcula a quantidade de cupons de sorteio com base no valor do presente.
 * Regra do PRD: Math.floor(valor / 50) — a cada R$ 50,00 = 1 número da sorte.
 */
export function calcularCupons(valor: number): number {
  return Math.floor(valor / 50);
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
 * Gera números da sorte formatados com zero à esquerda (ex: #042, #043).
 */
export function gerarNumerosSorte(qtd: number, base: number = 42): string[] {
  const numeros: string[] = [];
  for (let i = 0; i < qtd; i++) {
    const num = base + i;
    numeros.push(`#${String(num).padStart(3, '0')}`);
  }
  return numeros;
}

/**
 * Gera um ID pseudo-aleatório simples para uso em mock data.
 */
export function gerarId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
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
