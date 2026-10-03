import { db, type Contribuicao } from '../_shared/db.ts';
import { json } from '../_shared/http.ts';
import { sincronizarComAsaas } from '../_shared/sincronizar.ts';

/**
 * Webhook de cobranças do Asaas.
 * Deploy SEM verificação de JWT (o Asaas não manda token do Supabase):
 *   supabase functions deploy webhook-asaas --no-verify-jwt
 *
 * A autenticidade é garantida pelo header `asaas-access-token` (ASAAS_WEBHOOK_TOKEN)
 * e, além disso, o status é sempre reconsultado na API do Asaas.
 *
 * Importante: responder 200 sempre que possível — o Asaas pausa a fila de webhooks
 * depois de falhas seguidas.
 */
const TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);

  if (!TOKEN || !tokensIguais(req.headers.get('asaas-access-token') ?? '', TOKEN)) {
    return json({ ok: false }, 401);
  }

  const evento = await req.json().catch(() => null);
  const pagamento = evento?.payment;
  if (!pagamento?.id) return json({ ok: true, ignorado: 'sem pagamento' });

  // Parcelado: todas as parcelas mudam de status juntas; acompanhamos só a 1ª (a que fica salva).
  if (Number(pagamento.installmentNumber) > 1) return json({ ok: true, ignorado: 'parcela seguinte' });

  const c = await buscarPorCobranca(String(pagamento.id), pagamento.externalReference);

  // Cobrança que não é deste site (ex.: criada manualmente no painel do Asaas).
  if (!c) return json({ ok: true, ignorado: 'contribuicao nao encontrada' });

  try {
    const status = await sincronizarComAsaas(c);
    return json({ ok: true, evento: evento.event, status });
  } catch (err) {
    console.error(err);
    // Aqui sim devolvemos erro: o Asaas vai reenviar e tentamos de novo.
    return json({ ok: false }, 500);
  }
});

async function buscarPorCobranca(paymentId: string, externalReference: unknown): Promise<Contribuicao | null> {
  const { data } = await db.from('contribuicoes').select('*').eq('asaas_payment_id', paymentId).maybeSingle();
  if (data) return data as Contribuicao;

  // Fallback: o webhook chegou antes de salvarmos o asaas_payment_id.
  if (typeof externalReference === 'string' && /^[0-9a-f-]{36}$/i.test(externalReference)) {
    const { data: porRef } = await db.from('contribuicoes').select('*').eq('id', externalReference).maybeSingle();
    if (porRef && !porRef.asaas_payment_id) return { ...(porRef as Contribuicao), asaas_payment_id: paymentId };
  }
  return null;
}

function tokensIguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
