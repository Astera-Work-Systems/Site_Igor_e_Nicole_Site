import { createClient } from 'npm:@supabase/supabase-js@2';

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetadas automaticamente pelo Supabase nas Edge Functions.
export const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

export interface Contribuicao {
  id: string;
  presente_id: string | null;
  presente_titulo: string;
  tipo: 'site' | 'pessoalmente';
  forma_pagamento: 'pix' | 'cartao' | null;
  status: 'pendente' | 'confirmado' | 'cancelado';
  quantidade: number;
  valor: number;
  parcelas: number;
  nome_convidado: string;
  whatsapp: string;
  mensagem: string | null;
  asaas_payment_id: string | null;
  asaas_invoice_url: string | null;
  expira_em: string | null;
}

export async function listarCupons(contribuicaoId: string): Promise<number[]> {
  const { data } = await db
    .from('cupons_sorteio')
    .select('numero_cupom')
    .eq('contribuicao_id', contribuicaoId)
    .order('numero_cupom');
  return (data ?? []).map((c) => c.numero_cupom as number);
}

export async function confirmar(id: string): Promise<void> {
  const { error } = await db.rpc('confirmar_contribuicao', { p_id: id });
  if (error) throw error;
}

export async function cancelar(id: string): Promise<void> {
  const { error } = await db.rpc('cancelar_contribuicao', { p_id: id });
  if (error) throw error;
}
