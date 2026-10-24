import { db } from './db.ts';

/**
 * CORS restrito: só o site dos noivos (e o `npm run dev` / `npm run preview`) chamam as funções
 * pelo navegador. Para trocar/adicionar domínios (ex.: domínio próprio), defina a lista separada por vírgula:
 *   supabase secrets set ALLOWED_ORIGINS=https://igor-e-nicole.vercel.app,https://www.seudominio.com.br
 */
const ORIGENS_PADRAO = [
  'https://igor-e-nicole.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
const ORIGENS_PERMITIDAS = new Set(ORIGENS.length > 0 ? ORIGENS : ORIGENS_PADRAO);

export function origemPermitida(origem: string | null): boolean {
  return origem !== null && ORIGENS_PERMITIDAS.has(origem);
}

const CABECALHOS_SEGUROS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CABECALHOS_SEGUROS });
}

export function erro(mensagem: string, status = 400): Response {
  return json({ erro: mensagem }, status);
}

/**
 * Envolve o handler de uma função chamada pelo site:
 *  - responde o preflight (OPTIONS) e só libera CORS para as origens permitidas;
 *  - recusa navegador de outro domínio (403) antes de tocar no banco ou no Asaas;
 *  - aceita só POST.
 * Chamadas sem `Origin` (curl, scripts) não são barradas aqui — CORS só vale para navegadores;
 * contra abuso, cada função usa `limitar()`.
 */
export function servirParaSite(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    const origem = req.headers.get('Origin');
    const cors: Record<string, string> = origemPermitida(origem)
      ? {
          'Access-Control-Allow-Origin': origem!,
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        }
      : { Vary: 'Origin' };

    let res: Response;
    if (origem !== null && !origemPermitida(origem)) res = erro('Origem não permitida.', 403);
    else if (req.method === 'OPTIONS') res = new Response(null, { status: 204 });
    else if (req.method !== 'POST') res = erro('Método não permitido.', 405);
    else res = await handler(req);

    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  });
}

/** IP de quem chamou (o Supabase coloca no x-forwarded-for; o primeiro é o do cliente). */
function ipDoCliente(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? '';
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'desconhecido';
}

/** LGPD: o IP não é guardado, só um hash dele (não dá para voltar ao IP a partir do banco). */
async function hash(texto: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Limite de requisições por IP (equivalente ao express-rate-limit), guardado no banco para valer
 * entre as instâncias da Edge Function. Devolve a resposta 429 quando passou do limite, ou null.
 * Se o próprio contador falhar, deixa passar (não derruba pagamento por causa do limitador).
 */
export async function limitar(
  req: Request,
  rota: string,
  max: number,
  janelaSegundos: number,
): Promise<Response | null> {
  try {
    const chave = `${rota}:${await hash(ipDoCliente(req))}`;
    const { data, error } = await db.rpc('consumir_limite', {
      p_chave: chave,
      p_max: max,
      p_janela_segundos: janelaSegundos,
    });
    if (error) throw error;
    if (data === false) {
      const res = erro('Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.', 429);
      res.headers.set('Retry-After', String(janelaSegundos));
      return res;
    }
  } catch (err) {
    console.error('Limitador de requisições falhou (requisição liberada):', err);
  }
  return null;
}

/** Erros de RAISE EXCEPTION das nossas funções SQL (código P0001) são mensagens para o convidado. */
export function mensagemDoBanco(error: { code?: string; message: string }, padrao: string): string {
  return error.code === 'P0001' ? error.message : padrao;
}
