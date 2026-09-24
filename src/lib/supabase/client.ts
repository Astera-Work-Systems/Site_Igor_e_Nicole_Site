import { createClient } from '@supabase/supabase-js';

/**
 * Cliente público do Supabase (browser-side).
 *
 * Lê VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (públicas — a anon key pode ir pro navegador;
 * a segurança está nas regras RLS do banco). NUNCA coloque chaves do Asaas ou a service_role aqui:
 * tudo que começa com VITE_ vai parar no JavaScript do site.
 *
 * Sem essas variáveis, o cliente é null e o site roda em modo demonstração (dados mock).
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
