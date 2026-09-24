import { obterCobranca, statusPago, statusPerdido } from './asaas.ts';
import { cancelar, confirmar, db, type Contribuicao } from './db.ts';

/**
 * Consulta a cobrança direto na API do Asaas (fonte da verdade) e atualiza a contribuição.
 * Usada pelo webhook e pelo polling da tela de pagamento. É idempotente.
 */
export async function sincronizarComAsaas(c: Contribuicao): Promise<Contribuicao['status']> {
  if (!c.asaas_payment_id) return c.status;

  const cobranca = await obterCobranca(c.asaas_payment_id);

  if (statusPago(cobranca.status) && !cobranca.deleted) {
    if (c.status !== 'confirmado') await confirmar(c.id);
    return 'confirmado';
  }
  if (statusPerdido(cobranca)) {
    if (c.status !== 'cancelado') await cancelar(c.id);
    return 'cancelado';
  }
  return c.status;
}

export async function buscarContribuicao(id: string): Promise<Contribuicao | null> {
  const { data } = await db.from('contribuicoes').select('*').eq('id', id).maybeSingle();
  return data as Contribuicao | null;
}
