import { listarCupons } from '../_shared/db.ts';
import { erro, json, limitar, servirParaSite } from '../_shared/http.ts';
import { buscarContribuicao, sincronizarComAsaas } from '../_shared/sincronizar.ts';
import { EntradaStatus, lerEntrada } from '../_shared/validacao.ts';

/** A tela do Pix consulta a cada 5 s (120 em 10 min); o limite deixa folga para duas abas abertas. */
const LIMITE_POR_IP = 300;
const JANELA_SEGUNDOS = 10 * 60;

/**
 * Polling da tela de pagamento. O id da contribuição é um UUID aleatório que só o
 * convidado que criou conhece, e a resposta não traz dados pessoais.
 */
servirParaSite(async (req) => {
  const bloqueio = await limitar(req, 'status-contribuicao', LIMITE_POR_IP, JANELA_SEGUNDOS);
  if (bloqueio) return bloqueio;

  const entrada = await lerEntrada(req, EntradaStatus);
  if (!entrada) return erro('Id inválido.');

  const c = await buscarContribuicao(entrada.id);
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
