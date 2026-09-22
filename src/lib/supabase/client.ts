import { createClient } from '@supabase/supabase-js';

/**
 * Cliente público do Supabase (browser-side).
 *
 * As credenciais são lidas de variáveis de ambiente. Quando o Supabase
 * ainda não estiver configurado (credenciais vazias), o cliente retorna
 * null e a aplicação usa os dados mock em memória.
 *
 * Para integrar:
 *  1. Crie um arquivo .env.local na raiz do projeto
 *  2. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 *  3. As tabelas (presentes, transacoes, cupons_sorteio) já estão migradas
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
