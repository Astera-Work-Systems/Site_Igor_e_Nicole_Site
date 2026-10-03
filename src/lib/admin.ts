import { supabase } from '@/lib/supabase/client';
import { compactarImagem } from '@/lib/utils/imagem';
import { VALOR_MINIMO_PAGAMENTO } from '@/lib/utils/presentes';
import type { Configuracoes, Contribuicao, CupomSorteio, Presente, PresenteEditavel } from '@/types';

/**
 * Operações do painel dos noivos. Todas passam pelas regras RLS do banco:
 * só funcionam para usuários cadastrados na tabela `admins`.
 */

function db() {
  if (!supabase) throw new Error('Supabase não configurado.');
  return supabase;
}

export async function entrar(email: string, senha: string) {
  const { error } = await db().auth.signInWithPassword({ email: email.trim(), password: senha });
  if (!error) return;
  console.error('Login do painel falhou:', error.code, error.message);
  if (error.code === 'email_not_confirmed') {
    throw new Error('E-mail ainda não confirmado. No Supabase → Authentication → Users, confirme o usuário.');
  }
  if (error.code === 'invalid_credentials') throw new Error('E-mail ou senha incorretos.');
  throw new Error(`Não foi possível entrar: ${error.message}`);
}

export async function sair() {
  await db().auth.signOut();
}

/** Falha de rede/servidor vira erro (não "false"), para não confundir com "não é admin". */
export async function souAdmin(): Promise<boolean> {
  const { data, error } = await db().rpc('is_admin');
  if (error) {
    console.error('Verificação de admin falhou:', error.code, error.message);
    throw new Error(error.message);
  }
  return data === true;
}

export async function listarPresentesAdmin(): Promise<Presente[]> {
  const { data, error } = await db().from('presentes_vitrine').select('*').order('created_at');
  if (error) throw error;
  return data as Presente[];
}

export async function salvarPresente(p: PresenteEditavel): Promise<void> {
  const campos = camposPresente(p);
  const { error } = p.id
    ? await db().from('presentes').update(campos).eq('id', p.id)
    : await db().from('presentes').insert(campos);
  if (error) throw error;
}

/** Cria vários presentes numa única ida ao banco (tudo ou nada). */
export async function criarPresentes(lista: PresenteEditavel[]): Promise<void> {
  const { error } = await db().from('presentes').insert(lista.map(camposPresente));
  if (error) throw error;
}

// O Asaas não emite cobrança abaixo de R$ 5,00.
const VALOR_MINIMO_LIVRE = VALOR_MINIMO_PAGAMENTO;

function camposPresente(p: PresenteEditavel) {
  return {
    titulo: p.titulo,
    categoria: p.categoria,
    imagem_url: p.imagem_url,
    modo: p.modo,
    valor: p.valor,
    quantidade_total: p.modo === 'livre' ? 1 : p.quantidade_total,
    valor_minimo: p.modo === 'livre' ? Math.max(p.valor_minimo ?? 0, VALOR_MINIMO_LIVRE) : null,
    permite_pessoalmente: p.modo === 'inteiro' && p.permite_pessoalmente,
    ativo: p.ativo,
  };
}

export async function excluirPresente(id: string, imagemUrl?: string): Promise<void> {
  const { error } = await db().from('presentes').delete().eq('id', id);
  if (error) throw error;
  if (imagemUrl) await removerImagemPresente(imagemUrl);
}

// ==================== Imagens (Supabase Storage) ====================

const BUCKET_IMAGENS = 'presentes';

/** Compacta a foto no navegador e envia ao Storage. Devolve a URL pública. */
export async function enviarImagemPresente(arquivo: File): Promise<string> {
  const { blob, extensao } = await compactarImagem(arquivo);
  const caminho = `${crypto.randomUUID()}.${extensao}`;
  const { error } = await db()
    .storage.from(BUCKET_IMAGENS)
    .upload(caminho, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) {
    console.error('Upload da imagem falhou:', error.message);
    throw new Error('Não foi possível enviar a imagem.');
  }
  return db().storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
}

/** Apaga do Storage uma imagem enviada pelo painel. Links externos são ignorados. */
export async function removerImagemPresente(url: string): Promise<void> {
  const marcador = `/storage/v1/object/public/${BUCKET_IMAGENS}/`;
  const i = url.indexOf(marcador);
  if (i === -1) return;
  const caminho = decodeURIComponent(url.slice(i + marcador.length));
  const { error } = await db().storage.from(BUCKET_IMAGENS).remove([caminho]);
  // Não bloqueia o fluxo: no pior caso sobra um arquivo de poucos KB.
  if (error) console.error('Não foi possível apagar a imagem antiga:', error.message);
}

export async function listarContribuicoes(): Promise<Contribuicao[]> {
  const { data, error } = await db()
    .from('contribuicoes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Contribuicao[];
}

export async function cancelarContribuicao(id: string): Promise<void> {
  const { error } = await db().rpc('cancelar_contribuicao', { p_id: id });
  if (error) throw error;
}

export async function listarCupons(): Promise<CupomSorteio[]> {
  const { data, error } = await db().from('cupons_sorteio').select('*').order('numero_cupom');
  if (error) throw error;
  return data as CupomSorteio[];
}

export async function salvarConfiguracoes(c: Configuracoes): Promise<void> {
  const { error } = await db()
    .from('configuracoes')
    .update({
      cupom_pessoalmente: c.cupom_pessoalmente,
      valor_por_cupom: c.valor_por_cupom,
      minutos_reserva: c.minutos_reserva,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw error;
}
