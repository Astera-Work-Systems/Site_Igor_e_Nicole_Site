import type { Presente } from '@/types';
import { formatarValor } from '@/lib/utils/cupons';

export interface Disponibilidade {
  esgotado: boolean;
  /** 0–100 */
  progresso: number;
  /** unidades/cotas restantes (inteiro/cotas) */
  restanteQtd: number;
  /** valor que ainda falta (livre) */
  restanteValor: number;
  /** menor valor que o convidado pode dar agora */
  valorEntrada: number;
  resumo: string;
  restanteTexto: string;
  rotuloValor: string;
}

export function disponibilidade(p: Presente): Disponibilidade {
  if (p.modo === 'livre') {
    const restanteValor = Math.max(0, p.valor - p.valor_ocupado);
    const minimo = Math.min(p.valor_minimo ?? 1, restanteValor);
    return {
      esgotado: restanteValor <= 0,
      progresso: Math.min(100, (p.valor_ocupado / p.valor) * 100),
      restanteQtd: restanteValor > 0 ? 1 : 0,
      restanteValor,
      valorEntrada: minimo,
      resumo: `${formatarValor(p.valor_ocupado)} de ${formatarValor(p.valor)}`,
      restanteTexto: `faltam ${formatarValor(restanteValor)}`,
      rotuloValor: 'Contribua a partir de',
    };
  }

  const restanteQtd = Math.max(0, p.quantidade_total - p.quantidade_ocupada);
  const unidade = p.modo === 'cotas' ? 'cotas' : p.quantidade_total > 1 ? 'unidades' : 'unidade';
  return {
    esgotado: restanteQtd <= 0,
    progresso: Math.min(100, (p.quantidade_ocupada / p.quantidade_total) * 100),
    restanteQtd,
    restanteValor: restanteQtd * p.valor,
    valorEntrada: p.valor,
    resumo: `${p.quantidade_ocupada} de ${p.quantidade_total} ${unidade}`,
    restanteTexto: `${restanteQtd} ${restanteQtd === 1 ? 'restante' : 'restantes'}`,
    rotuloValor: p.modo === 'cotas' ? 'Valor da cota' : 'Valor',
  };
}

export const MODOS_PRESENTE = {
  inteiro: { nome: 'Inteiro (sem cota)', descricao: 'O convidado dá o presente completo. Pode ter várias unidades.' },
  cotas: { nome: 'Cotas fixas', descricao: 'O valor é dividido em cotas iguais; o convidado escolhe quantas dar.' },
  livre: { nome: 'Valor livre', descricao: 'O convidado escolhe quanto dar (com um mínimo) até completar a meta.' },
} as const;
