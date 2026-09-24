import { listarCupons } from '../_shared/db.ts';
import { corsHeaders, erro, json } from '../_shared/http.ts';
import { buscarContribuicao, sincronizarComAsaas } from '../_shared/sincronizar.ts';

/**
 * Polling da tela de pagamento. O id da contribuição é um UUID aleatório que só o
 * convidado que criou conhece, e a resposta não traz dados pessoais.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return erro('Método não permitido.', 405);

  const { id } = await req.json().catch(() => ({ id: null }));
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return erro('Id inválido.');

  const c = await buscarContribuicao(id);
  if (!c) return erro('Contribuição não encontrada.', 404);

  let status = c.status;
  // Não depende só do webhook: se ainda está pendente, pergunta ao Asaas.
  if (status === 'pendente') {
    try {
      status = await sincronizarComAsaas(c);
    } catch (err) {
      console.error(err);
    }
  }

  return json({
    id: c.id,
    status,
    cupons: status === 'confirmado' ? await listarCupons(c.id) : [],
  });
});
