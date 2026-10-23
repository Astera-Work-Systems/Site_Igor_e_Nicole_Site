import { excluirCobranca, excluirParcelamento, obterCobranca, statusPago, statusPerdido } from './asaas.ts';
import { cancelar, confirmar, db, type Contribuicao } from './db.ts';

/**
 * Consulta a cobrança direto na API do Asaas (fonte da verdade) e atualiza a contribuição.
 * Usada pelo webhook e pelo polling da tela de pagamento. É idempotente.
 */
export async function sincronizarComAsaas(c: Contribuicao): Promise<Contribuicao['status']> {
  if (!c.asaas_payment_id) return c.status;

  const cobranca = await obterCobranca(c.asaas_payment_id);

  // Dinheiro que entrou vale, mesmo numa cobrança que tínhamos apagado: os noivos veem no painel.
  if (statusPago(cobranca.status)) {
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

/**
 * Antes de alguém reservar o presente: reservas dele que passaram do prazo sem pagamento têm a
 * cobrança apagada no Asaas (o Pix/cartão antigo não pode mais ser pago) e são canceladas.
 * Evita o presente em dobro: reserva expira, outra pessoa compra, a primeira paga o Pix antigo.
 * Se a cobrança já tinha sido paga, confirma — e o presente continua de quem pagou.
 */
export async function liberarReservasVencidas(presenteId: string): Promise<void> {
  const { data } = await db
    .from('contribuicoes')
    .select('*')
    .eq('presente_id', presenteId)
    .eq('status', 'pendente')
    .lt('expira_em', new Date().toISOString());

  for (const c of (data ?? []) as Contribuicao[]) {
    try {
      if (c.asaas_payment_id) {
        if ((await sincronizarComAsaas(c)) !== 'pendente') continue;
        await (c.asaas_installment_id
          ? excluirParcelamento(c.asaas_installment_id)
          : excluirCobranca(c.asaas_payment_id));
      }
      await cancelar(c.id);
    } catch (err) {
      console.error(err);
      // O Asaas recusa apagar cobrança paga: se foi paga neste meio-tempo, confirma.
      await sincronizarComAsaas(c).catch(console.error);
    }
  }
}
