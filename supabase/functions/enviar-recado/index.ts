import { db } from '../_shared/db.ts';
import { erro, json, limitar, servirParaSite } from '../_shared/http.ts';
import { EntradaRecado, lerEntrada } from '../_shared/validacao.ts';

/**
 * Recado do mural. Antes era um INSERT direto do navegador na tabela `recados`, sem limite:
 * um robô podia encher o mural. Agora passa por aqui, com limite por IP.
 */
const LIMITE_POR_IP = 5;
const JANELA_SEGUNDOS = 10 * 60;

servirParaSite(async (req) => {
  const bloqueio = await limitar(req, 'enviar-recado', LIMITE_POR_IP, JANELA_SEGUNDOS);
  if (bloqueio) return bloqueio;

  const e = await lerEntrada(req, EntradaRecado);
  if (!e) return erro('Requisição inválida.');

  const nome = e.nome.trim();
  const mensagem = e.mensagem.trim();
  if (nome.length < 3 || nome.length > 80) return erro('Informe seu nome (3 a 80 caracteres).');
  if (mensagem.length < 5 || mensagem.length > 500) return erro('A mensagem precisa ter de 5 a 500 caracteres.');

  const { data, error } = await db
    .from('recados')
    .insert({ nome_convidado: nome, mensagem, presente_titulo: 'Mensagem de carinho' })
    .select('id, nome_convidado, mensagem, presente_titulo, created_at')
    .single();
  if (error) {
    console.error(error);
    return erro('Não foi possível enviar agora. Tente novamente.', 500);
  }
  return json(data);
});
