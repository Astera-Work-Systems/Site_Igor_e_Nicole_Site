import { supabase } from '@/lib/supabase/client';
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
  const { error } = await db().auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error('E-mail ou senha incorretos.');
}

export async function sair() {
  await db().auth.signOut();
}

export async function souAdmin(): Promise<boolean> {
  const { data } = await db().rpc('is_admin');
  return data === true;
}

export async function listarPresentesAdmin(): Promise<Presente[]> {
  const { data, error } = await db().from('presentes_vitrine').select('*').order('created_at');
  if (error) throw error;
  return data as Presente[];
}

export async function salvarPresente(p: PresenteEditavel): Promise<void> {
  const campos = {
    titulo: p.titulo,
    categoria: p.categoria,
    imagem_url: p.imagem_url,
    modo: p.modo,
    valor: p.valor,
    quantidade_total: p.modo === 'livre' ? 1 : p.quantidade_total,
    valor_minimo: p.modo === 'livre' ? p.valor_minimo : null,
    permite_pessoalmente: p.modo === 'inteiro' && p.permite_pessoalmente,
    ativo: p.ativo,
  };
  const { error } = p.id
    ? await db().from('presentes').update(campos).eq('id', p.id)
    : await db().from('presentes').insert(campos);
  if (error) throw error;
}

export async function excluirPresente(id: string): Promise<void> {
  const { error } = await db().from('presentes').delete().eq('id', id);
  if (error) throw error;
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
