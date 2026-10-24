/**
 * Testes das Edge Functions com banco (PostgREST) e Asaas SIMULADOS: nada real é chamado.
 *   npx deno@2.9.6 test -A --node-modules-dir=none supabase/tests/edge-functions.test.ts
 *
 * Cobre segurança (CORS, validação, limite por IP, vazamento de erro do banco, webhook)
 * e funcionalidade (Pix, "pessoalmente", status, recado).
 */
import { assert, assertEquals, assertMatch } from 'jsr:@std/assert@1.0.13';

Deno.env.set('SUPABASE_URL', 'http://banco.teste');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-teste');
Deno.env.set('ASAAS_API_KEY', 'asaas-teste');
Deno.env.set('ASAAS_BASE_URL', 'http://asaas.teste/v3');
Deno.env.set('ASAAS_WEBHOOK_TOKEN', 'token-webhook-teste');

// ==================== Simulação de banco + Asaas ====================

const SITE = 'https://igor-e-nicole.vercel.app';
const PRESENTE = '11111111-1111-4111-8111-111111111111';
const CONTRIB = '22222222-2222-4222-8222-222222222222';
const CPF_OK = '52998224725';

interface Chamada {
  metodo: string;
  url: URL;
  corpo: unknown;
}
let chamadas: Chamada[] = [];
let contadores = new Map<string, number>();
let limitadorQuebrado = false;
let erroReserva: { code: string; message: string } | null = null;
let statusAsaas = 'PENDING';

function contribuicao(tipo: 'site' | 'pessoalmente') {
  return {
    id: CONTRIB, presente_id: PRESENTE, presente_titulo: 'Jogo de Panelas', tipo,
    forma_pagamento: tipo === 'site' ? 'pix' : null, status: 'pendente', quantidade: 1, valor: 250,
    parcelas: 1, nome_convidado: 'Maria Silva', whatsapp: '63999998888', mensagem: null,
    asaas_payment_id: 'pay_1', asaas_installment_id: null, asaas_invoice_url: null,
    expira_em: new Date(Date.now() + 30 * 60e3).toISOString(),
  };
}

const resp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const req = new Request(input, init);
  const url = new URL(req.url);
  const texto = await req.text();
  const corpo = texto ? JSON.parse(texto) : null;
  chamadas.push({ metodo: req.method, url, corpo });

  if (url.host === 'banco.teste') {
    const caminho = url.pathname.replace('/rest/v1/', '');
    if (caminho === 'rpc/consumir_limite') {
      if (limitadorQuebrado) return resp({ code: '57014', message: 'timeout' }, 500);
      const n = (contadores.get(corpo.p_chave) ?? 0) + 1;
      contadores.set(corpo.p_chave, n);
      return resp(n <= corpo.p_max);
    }
    if (caminho === 'rpc/reservar_contribuicao') {
      if (erroReserva) return resp(erroReserva, 400);
      return resp(contribuicao(corpo.p_tipo));
    }
    if (caminho === 'rpc/confirmar_contribuicao' || caminho === 'rpc/cancelar_contribuicao') return resp({});
    if (caminho === 'configuracoes') return resp([{ max_parcelas: 12 }]);
    if (caminho === 'cupons_sorteio') return resp([{ numero_cupom: 7 }]);
    if (caminho === 'contribuicoes') {
      if (req.method === 'PATCH') return resp([]);
      // liberarReservasVencidas filtra status=pendente & expira_em<agora: nada vencido nos testes.
      if (url.searchParams.has('expira_em')) return resp([]);
      if (url.searchParams.get('id') === `eq.${CONTRIB}`) return resp([contribuicao('site')]);
      if (url.searchParams.get('asaas_payment_id') === 'eq.pay_1') return resp([contribuicao('site')]);
      return resp([]);
    }
    if (caminho === 'recados') {
      return resp({ id: 'r1', ...corpo, created_at: '2026-10-24T12:00:00Z' }, 201);
    }
    return resp({ message: `rota não simulada: ${caminho}` }, 404);
  }

  if (url.host === 'asaas.teste') {
    const p = url.pathname.replace('/v3', '');
    if (p === '/customers' && req.method === 'GET') return resp({ data: [] });
    if (p === '/customers') return resp({ id: 'cus_1' });
    if (p === '/payments' && req.method === 'POST') {
      return resp({ id: 'pay_1', status: 'PENDING', value: corpo.value, invoiceUrl: 'https://asaas.teste/i/pay_1' });
    }
    if (p === '/payments/pay_1/pixQrCode') return resp({ payload: 'PIX-COPIA-E-COLA', encodedImage: 'QR', expirationDate: '' });
    if (p === '/payments/pay_1') return resp({ id: 'pay_1', status: statusAsaas, value: 250, invoiceUrl: '' });
    return resp({ errors: [{ description: 'rota não simulada' }] }, 404);
  }
  throw new Error(`Rede real bloqueada no teste: ${url}`);
};

// Cada função chama Deno.serve ao ser importada: guardamos o handler em vez de abrir porta.
const handlers: ((req: Request) => Promise<Response>)[] = [];
// deno-lint-ignore no-explicit-any
(Deno as any).serve = (h: (req: Request) => Promise<Response>) => {
  handlers.push(h);
  return { finished: Promise.resolve(), shutdown() {}, ref() {}, unref() {} };
};
async function carregar(nome: string) {
  await import(`../functions/${nome}/index.ts`);
  return handlers[handlers.length - 1];
}
const criar = await carregar('criar-contribuicao');
const status = await carregar('status-contribuicao');
const recado = await carregar('enviar-recado');
const webhook = await carregar('webhook-asaas');

let ipSeq = 0;
function novoIp() {
  return `200.1.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
}
function post(corpo: unknown, opts: { origem?: string | null; ip?: string; metodo?: string; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': `${opts.ip ?? novoIp()}, 10.0.0.1`, ...opts.headers };
  if (opts.origem !== null) headers.Origin = opts.origem ?? SITE;
  return new Request('http://funcao.teste/', {
    method: opts.metodo ?? 'POST',
    headers,
    body: opts.metodo === 'GET' || opts.metodo === 'OPTIONS' ? undefined : typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });
}
const pix = (extra: Record<string, unknown> = {}) => ({
  presente_id: PRESENTE, tipo: 'site', forma_pagamento: 'pix', quantidade: 1, parcelas: 1,
  nome: 'Maria Silva', whatsapp: '(63) 99999-8888', cpf: '529.982.247-25', mensagem: 'Felicidades!', ...extra,
});

function limpar() {
  chamadas = [];
  contadores = new Map();
  limitadorQuebrado = false;
  erroReserva = null;
  statusAsaas = 'PENDING';
}
const chamou = (trecho: string) => chamadas.some((c) => c.url.pathname.includes(trecho));

// ==================== CORS e cabeçalhos ====================

Deno.test('CORS: preflight do site é liberado só para a origem dele', async () => {
  limpar();
  const r = await criar(post(null, { metodo: 'OPTIONS' }));
  assertEquals(r.status, 204);
  assertEquals(r.headers.get('Access-Control-Allow-Origin'), SITE);
  assertEquals(r.headers.get('Vary'), 'Origin');
});

Deno.test('CORS: site de outro domínio recebe 403, sem tocar no banco nem no Asaas', async () => {
  for (const fn of [criar, status, recado]) {
    limpar();
    const pre = await fn(post(null, { metodo: 'OPTIONS', origem: 'https://site-malicioso.com' }));
    assertEquals(pre.status, 403);
    assertEquals(pre.headers.get('Access-Control-Allow-Origin'), null);
    const r = await fn(post(pix(), { origem: 'https://igor-e-nicole.vercel.app.malicioso.com' }));
    assertEquals(r.status, 403);
    assertEquals(chamadas.length, 0);
  }
});

Deno.test('CORS: "*" não aparece mais e origem "null" (iframe/arquivo local) é recusada', async () => {
  limpar();
  const r = await criar(post(pix(), { origem: 'null' }));
  assertEquals(r.status, 403);
  const ok = await criar(post(pix()));
  assert(ok.headers.get('Access-Control-Allow-Origin') !== '*');
});

Deno.test('Métodos: GET/PUT recebem 405', async () => {
  limpar();
  assertEquals((await criar(post(null, { metodo: 'GET' }))).status, 405);
  assertEquals((await recado(post({}, { metodo: 'PUT' }))).status, 405);
});

Deno.test('Cabeçalhos: respostas JSON com nosniff e no-store', async () => {
  limpar();
  const r = await status(post({ id: CONTRIB }));
  assertEquals(r.headers.get('X-Content-Type-Options'), 'nosniff');
  assertEquals(r.headers.get('Cache-Control'), 'no-store');
  assertMatch(r.headers.get('Content-Type') ?? '', /application\/json/);
});

// ==================== Validação (zod) ====================

Deno.test('Validação: corpo que não é JSON, null, array ou vazio → 400 sem quebrar', async () => {
  for (const corpo of ['isto não é json', 'null', '[]', '', '{"a":', '"texto"']) {
    limpar();
    const r = await criar(post(corpo));
    assertEquals(r.status, 400, `corpo ${JSON.stringify(corpo)}`);
    assertEquals((await r.json()).erro, 'Requisição inválida.');
    assert(!chamou('reservar_contribuicao'));
  }
});

Deno.test('Validação: presente_id fora do formato UUID (ex.: injeção) é recusado antes do banco', async () => {
  for (const id of ["1' OR '1'='1", '../../etc/passwd', 'abc', 123, null]) {
    limpar();
    const r = await criar(post(pix({ presente_id: id })));
    assertEquals(r.status, 400);
    assert(!chamou('reservar_contribuicao'));
  }
});

Deno.test('Validação: campos extras (tentar mandar o preço, status...) são recusados', async () => {
  for (const extra of [{ valor: 0.01 }, { p_valor: 1 }, { status: 'confirmado' }, { __proto__x: 1 }]) {
    limpar();
    const r = await criar(post(pix(extra)));
    assertEquals(r.status, 400, JSON.stringify(extra));
    assert(!chamou('reservar_contribuicao'));
  }
});

Deno.test('Validação: tipos errados e tamanhos absurdos são recusados', async () => {
  const casos = [
    { quantidade: '1; DROP TABLE presentes' },
    { quantidade: 1.5 },
    { quantidade: 0 },
    { quantidade: 1e9 },
    { parcelas: 99 },
    { tipo: 'admin' },
    { forma_pagamento: 'boleto' },
    { nome: 'A'.repeat(10_000) },
    { mensagem: 'x'.repeat(100_000) },
    { whatsapp: { $gt: '' } },
  ];
  for (const extra of casos) {
    limpar();
    const r = await criar(post(pix(extra)));
    assertEquals(r.status, 400, JSON.stringify(extra).slice(0, 60));
    assert(!chamou('reservar_contribuicao'));
  }
});

Deno.test('Validação: regras amigáveis continuam (CPF inválido, nome curto, WhatsApp)', async () => {
  limpar();
  assertMatch((await (await criar(post(pix({ cpf: '111.111.111-11' })))).json()).erro, /CPF válido/);
  assertMatch((await (await criar(post(pix({ nome: 'Al' })))).json()).erro, /nome completo/);
  assertMatch((await (await criar(post(pix({ whatsapp: '123' })))).json()).erro, /WhatsApp válido/);
  assert(!chamou('reservar_contribuicao'));
});

// ==================== Erros do banco ====================

Deno.test('Erro do banco: mensagem de negócio (P0001) chega ao convidado', async () => {
  limpar();
  erroReserva = { code: 'P0001', message: 'Este presente já foi garantido por outro convidado. Obrigado!' };
  const r = await criar(post(pix()));
  assertEquals(r.status, 400);
  assertEquals((await r.json()).erro, erroReserva.message);
});

Deno.test('Erro do banco: erro interno do Postgres NÃO vaza para o navegador', async () => {
  limpar();
  erroReserva = { code: '42501', message: 'permission denied for table contribuicoes' };
  const r = await criar(post(pix()));
  const { erro } = await r.json();
  assert(!erro.includes('permission denied'));
  assertMatch(erro, /Não foi possível reservar/);
});

// ==================== Funcionalidade ====================

Deno.test('Funciona: Pix gera cobrança no valor do banco e devolve o copia-e-cola', async () => {
  limpar();
  const r = await criar(post(pix()));
  assertEquals(r.status, 200);
  const body = await r.json();
  assertEquals(body.status, 'pendente');
  assertEquals(body.pix.copia_e_cola, 'PIX-COPIA-E-COLA');
  const cobranca = chamadas.find((c) => c.url.pathname.endsWith('/payments') && c.metodo === 'POST');
  assertEquals((cobranca?.corpo as { value: number }).value, 250);
  const reserva = chamadas.find((c) => c.url.pathname.endsWith('reservar_contribuicao'));
  assertEquals((reserva?.corpo as { p_whatsapp: string }).p_whatsapp, '63999998888');
  const cliente = chamadas.find((c) => c.url.pathname.endsWith('/customers') && c.metodo === 'POST');
  assertEquals((cliente?.corpo as { cpfCnpj: string }).cpfCnpj, CPF_OK);
});

Deno.test('Funciona: "vou dar pessoalmente" confirma sem CPF e sem Asaas', async () => {
  limpar();
  const r = await criar(post({ presente_id: PRESENTE, tipo: 'pessoalmente', quantidade: 1, parcelas: 1, nome: 'João Souza', whatsapp: '63988887777', mensagem: '' }));
  assertEquals(r.status, 200);
  const body = await r.json();
  assertEquals(body.status, 'confirmado');
  assert(!chamadas.some((c) => c.url.host === 'asaas.teste'));
});

Deno.test('Funciona: o front manda campos undefined/null (pessoalmente) e passa', async () => {
  limpar();
  const r = await criar(post({ presente_id: PRESENTE, tipo: 'pessoalmente', forma_pagamento: null, cpf: null, quantidade: 1, parcelas: 1, nome: 'João Souza', whatsapp: '63988887777', mensagem: 'Oi' }));
  assertEquals(r.status, 200);
});

Deno.test('Funciona: status devolve confirmado + cupons quando o Asaas diz que pagou', async () => {
  limpar();
  statusAsaas = 'RECEIVED';
  const r = await status(post({ id: CONTRIB }));
  const body = await r.json();
  assertEquals(body.status, 'confirmado');
  assertEquals(body.cupons, [7]);
  assert(!('nome_convidado' in body) && !('whatsapp' in body));
});

Deno.test('Funciona: status com id inválido ou campo extra → 400', async () => {
  limpar();
  assertEquals((await status(post({ id: 'nao-e-uuid' }))).status, 400);
  assertEquals((await status(post({ id: CONTRIB, admin: true }))).status, 400);
});

Deno.test('Funciona: recado válido é gravado já sem espaços nas pontas', async () => {
  limpar();
  const r = await recado(post({ nome: '  Ana Paula ', mensagem: '  Muitas felicidades!  ' }));
  assertEquals(r.status, 200);
  const body = await r.json();
  assertEquals(body.nome_convidado, 'Ana Paula');
  assertEquals(body.mensagem, 'Muitas felicidades!');
  const ins = chamadas.find((c) => c.url.pathname.endsWith('/recados'));
  assertEquals((ins?.corpo as { presente_titulo: string }).presente_titulo, 'Mensagem de carinho');
});

Deno.test('Recado: curto, longo, com campos extras ou forjando presente → 400', async () => {
  for (const corpo of [
    { nome: 'Ana', mensagem: 'oi' },
    { nome: 'Ana', mensagem: 'x'.repeat(501) },
    { nome: 'A'.repeat(81), mensagem: 'Parabéns!!' },
    { nome: 'Ana', mensagem: 'Parabéns!!', presente_titulo: 'Geladeira' },
    { nome: 'Ana', mensagem: 'Parabéns!!', id: 'x' },
  ]) {
    limpar();
    assertEquals((await recado(post(corpo))).status, 400);
    assert(!chamou('/recados'));
  }
});

Deno.test('Recado: HTML/script é gravado como texto (o React mostra escapado), sem quebrar', async () => {
  limpar();
  const r = await recado(post({ nome: '<b>Ana</b>', mensagem: '<script>alert(1)</script>' }));
  assertEquals(r.status, 200);
});

// ==================== Limite por IP ====================

Deno.test('Limite: 16ª reserva do mesmo IP em 10 min → 429 com Retry-After; outro IP segue', async () => {
  limpar();
  const ip = '177.10.10.10';
  for (let i = 0; i < 15; i++) assertEquals((await criar(post(pix(), { ip }))).status, 200, `req ${i + 1}`);
  const bloqueada = await criar(post(pix(), { ip }));
  assertEquals(bloqueada.status, 429);
  assertEquals(bloqueada.headers.get('Retry-After'), '600');
  assertEquals(bloqueada.headers.get('Access-Control-Allow-Origin'), SITE);
  assertMatch((await bloqueada.json()).erro, /Muitas tentativas/);
  assertEquals((await criar(post(pix(), { ip: '177.10.10.11' }))).status, 200);
});

Deno.test('Limite: bloqueado não chega a tocar na reserva nem no Asaas', async () => {
  limpar();
  const ip = '177.20.20.20';
  for (let i = 0; i < 15; i++) await criar(post(pix(), { ip }));
  chamadas = [];
  await criar(post(pix(), { ip }));
  assertEquals(chamadas.map((c) => c.url.pathname), ['/rest/v1/rpc/consumir_limite']);
});

Deno.test('Limite: recado 6º em 10 min → 429; status aguenta o polling (300)', async () => {
  limpar();
  const ip = '177.30.30.30';
  for (let i = 0; i < 5; i++) assertEquals((await recado(post({ nome: 'Ana Paula', mensagem: 'Felicidades!' }, { ip }))).status, 200);
  assertEquals((await recado(post({ nome: 'Ana Paula', mensagem: 'Felicidades!' }, { ip }))).status, 429);
  for (let i = 0; i < 300; i++) assertEquals((await status(post({ id: CONTRIB }, { ip }))).status, 200);
  assertEquals((await status(post({ id: CONTRIB }, { ip }))).status, 429);
});

Deno.test('Limite: rotas têm contadores separados e o IP não vai em texto para o banco', async () => {
  limpar();
  const ip = '189.45.67.89';
  await criar(post(pix(), { ip }));
  await recado(post({ nome: 'Ana Paula', mensagem: 'Felicidades!' }, { ip }));
  const chaves = chamadas.filter((c) => c.url.pathname.endsWith('consumir_limite')).map((c) => (c.corpo as { p_chave: string }).p_chave);
  assertEquals(chaves.length, 2);
  assert(chaves[0].startsWith('criar-contribuicao:') && chaves[1].startsWith('enviar-recado:'));
  for (const k of chaves) {
    assert(!k.includes(ip), 'IP em texto puro');
    assertMatch(k, /:[0-9a-f]{64}$/);
  }
});

Deno.test('Limite: se o contador do banco falhar, o pagamento NÃO é bloqueado', async () => {
  limpar();
  limitadorQuebrado = true;
  assertEquals((await criar(post(pix()))).status, 200);
});

// ==================== Webhook ====================

Deno.test('Webhook: sem token / token errado / token de tamanho diferente → 401', async () => {
  for (const token of [undefined, 'token-webhook-testX', 'curto', 'token-webhook-teste-mais-longo']) {
    limpar();
    const headers: Record<string, string> = token ? { 'asaas-access-token': token } : {};
    const r = await webhook(post({ event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1' } }, { origem: null, headers }));
    assertEquals(r.status, 401);
    assert(!chamou('confirmar_contribuicao'));
  }
});

Deno.test('Webhook: token certo → reconsulta o Asaas e confirma', async () => {
  limpar();
  statusAsaas = 'CONFIRMED';
  const r = await webhook(post({ event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_1' } }, { origem: null, headers: { 'asaas-access-token': 'token-webhook-teste' } }));
  assertEquals(r.status, 200);
  assertEquals((await r.json()).status, 'confirmado');
  assert(chamou('/payments/pay_1'));
  assert(chamou('confirmar_contribuicao'));
});

Deno.test('Webhook: evento forjado dizendo "pago" não confirma se o Asaas diz pendente', async () => {
  limpar();
  statusAsaas = 'PENDING';
  const r = await webhook(post({ event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1', status: 'RECEIVED' } }, { origem: null, headers: { 'asaas-access-token': 'token-webhook-teste' } }));
  assertEquals((await r.json()).status, 'pendente');
  assert(!chamou('confirmar_contribuicao'));
});

// ==================== Fuzzing ====================
// Milhares de entradas aleatórias/maliciosas (semente fixa: o resultado é reproduzível).
// Regras que NUNCA podem quebrar, seja qual for a entrada:
//  1. a função responde (não trava, não lança exceção) com 200/400 — nunca 500;
//  2. o banco só recebe presente_id em formato UUID e quantidade inteira de 1 a 100;
//  3. o valor cobrado no Asaas é sempre o valor que veio do BANCO, nunca do navegador;
//  4. nenhuma resposta de erro expõe detalhes internos (stack, SQL, nomes de tabela).

function prng(semente: number) {
  return () => {
    semente = (semente * 1664525 + 1013904223) >>> 0;
    return semente / 2 ** 32;
  };
}
const TEXTOS_MALICIOSOS = [
  "' OR 1=1 --", '"; DROP TABLE presentes; --', '<script>alert(1)</script>', '${7*7}', '{{7*7}}',
  '../../../etc/passwd', '\u0000', '￿\uD800', '🎁'.repeat(300), 'A'.repeat(5000), '__proto__',
  'constructor', 'javascript:alert(1)', '%00', '\r\nSet-Cookie: x=1', '1e309', '-0', 'NaN', '',
  PRESENTE, CONTRIB, '52998224725', '(63) 99999-8888', 'Maria Silva',
];
function valorAleatorio(r: () => number, prof = 0): unknown {
  const t = Math.floor(r() * 12);
  if (prof > 3 && t > 8) return null;
  switch (t) {
    case 0: return TEXTOS_MALICIOSOS[Math.floor(r() * TEXTOS_MALICIOSOS.length)];
    case 1: return Math.floor(r() * 200) - 50;
    case 2: return r() * 1e12 * (r() < 0.5 ? -1 : 1);
    case 3: return [0, -1, 1.5, 1e308, -1e308, Number.MAX_SAFE_INTEGER + 2][Math.floor(r() * 6)];
    case 4: return r() < 0.5;
    case 5: return null;
    case 6: return undefined;
    case 7: return String.fromCharCode(...Array.from({ length: Math.floor(r() * 40) }, () => Math.floor(r() * 0xd7ff)));
    case 8: return ['site', 'pessoalmente', 'pix', 'cartao', 'boleto', 'admin'][Math.floor(r() * 6)];
    case 9: return Array.from({ length: Math.floor(r() * 4) }, () => valorAleatorio(r, prof + 1));
    default: {
      const o: Record<string, unknown> = {};
      for (let i = 0; i < Math.floor(r() * 4); i++) o[String(valorAleatorio(r, prof + 1)).slice(0, 20)] = valorAleatorio(r, prof + 1);
      return o;
    }
  }
}
const CAMPOS = ['presente_id', 'tipo', 'forma_pagamento', 'quantidade', 'parcelas', 'nome', 'whatsapp', 'cpf', 'mensagem'];
function corpoAleatorio(r: () => number): string {
  const modo = r();
  if (modo < 0.05) return TEXTOS_MALICIOSOS[Math.floor(r() * TEXTOS_MALICIOSOS.length)]; // nem é JSON
  if (modo < 0.1) return JSON.stringify(valorAleatorio(r)) ?? '';
  // Parte do tempo começa de um pedido válido e estraga 1 a 3 campos (acha bugs mais "fundos").
  const base: Record<string, unknown> = r() < 0.6 ? pix() : {};
  for (let i = 0; i < 1 + Math.floor(r() * 3); i++) {
    const campo = r() < 0.85 ? CAMPOS[Math.floor(r() * CAMPOS.length)] : ['__proto__', 'valor', 'status', 'p_valor', 'constructor'][Math.floor(r() * 5)];
    base[campo] = valorAleatorio(r);
  }
  return JSON.stringify(base);
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VAZAMENTO = /stack|at \w+ \(|postgres|relation|column|syntax|TypeError|ReferenceError|undefined is|cannot read|deno|supabase|contribuicoes|rpc/i;

Deno.test('Fuzz: 3.000 pedidos aleatórios/maliciosos em criar-contribuicao', async () => {
  const r = prng(20261024);
  const contagem: Record<number, number> = {};
  let chegaramAoBanco = 0, chegaramAoAsaas = 0;
  for (let i = 0; i < 3000; i++) {
    limpar();
    const corpo = corpoAleatorio(r);
    const res = await criar(post(corpo));
    contagem[res.status] = (contagem[res.status] ?? 0) + 1;
    assert([200, 400].includes(res.status), `status ${res.status} para ${corpo.slice(0, 120)}`);
    const body = await res.json();
    if (res.status !== 200) assert(typeof body.erro === 'string' && !VAZAMENTO.test(body.erro), `erro vazou: ${body.erro}`);
    for (const c of chamadas) {
      if (c.url.pathname.endsWith('reservar_contribuicao')) {
        chegaramAoBanco++;
        const a = c.corpo as Record<string, unknown>;
        assert(UUID_RE.test(String(a.p_presente_id)), `UUID inválido chegou ao banco: ${a.p_presente_id}`);
        const q = a.p_quantidade as number;
        assert(Number.isInteger(q) && q >= 1 && q <= 100, `quantidade ${q}`);
        assertEquals(a.p_valor, null, 'o navegador nunca define o valor');
        assert(['site', 'pessoalmente'].includes(String(a.p_tipo)));
      }
      if (c.url.pathname.endsWith('/payments') && c.metodo === 'POST') {
        chegaramAoAsaas++;
        const v = c.corpo as { value?: number; totalValue?: number };
        assertEquals(v.value ?? v.totalValue, 250, 'valor cobrado diferente do valor do banco');
      }
    }
  }
  console.log(`      status: ${JSON.stringify(contagem)} · chegaram ao banco: ${chegaramAoBanco} · viraram cobrança: ${chegaramAoAsaas}`);
  assert(chegaramAoBanco > 50, 'o fuzz precisa também gerar pedidos válidos');
});

Deno.test('Fuzz: 1.500 pedidos aleatórios em status e recado', async () => {
  const r = prng(42);
  for (let i = 0; i < 1500; i++) {
    limpar();
    const ehStatus = r() < 0.5;
    const corpo = ehStatus
      ? JSON.stringify({ id: valorAleatorio(r), ...(r() < 0.2 ? { x: 1 } : {}) })
      : JSON.stringify({ nome: valorAleatorio(r), mensagem: valorAleatorio(r), ...(r() < 0.2 ? { presente_titulo: 'x' } : {}) });
    const res = await (ehStatus ? status : recado)(post(r() < 0.1 ? corpoAleatorio(r) : corpo));
    assert([200, 400, 404].includes(res.status), `status ${res.status} para ${corpo.slice(0, 100)}`);
    const body = await res.json();
    if (res.status >= 400) assert(!VAZAMENTO.test(body.erro), `erro vazou: ${body.erro}`);
    for (const c of chamadas.filter((c) => c.url.pathname.endsWith('/recados'))) {
      const rec = c.corpo as Record<string, unknown>;
      assertEquals(Object.keys(rec).sort(), ['mensagem', 'nome_convidado', 'presente_titulo']);
      assertEquals(rec.presente_titulo, 'Mensagem de carinho');
      assert(typeof rec.nome_convidado === 'string' && rec.nome_convidado.length <= 80);
      assert(typeof rec.mensagem === 'string' && rec.mensagem.length <= 500);
    }
  }
});

Deno.test('Fuzz: JSON gigante ou muito aninhado não derruba a função', async () => {
  limpar();
  const aninhado = '['.repeat(50_000) + ']'.repeat(50_000);
  assertEquals((await criar(post(aninhado))).status, 400);
  const gigante = JSON.stringify({ ...pix(), mensagem: 'x'.repeat(5_000_000) });
  const t = Date.now();
  assertEquals((await criar(post(gigante))).status, 400);
  assert(Date.now() - t < 2000, 'corpo de 5 MB levou mais de 2 s');
  const muitasChaves = JSON.stringify(Object.fromEntries(Array.from({ length: 100_000 }, (_, i) => [`k${i}`, i])));
  assertEquals((await criar(post(muitasChaves))).status, 400);
  assert(!chamou('reservar_contribuicao'));
});

Deno.test('Fuzz: __proto__ no JSON não contamina objetos (prototype pollution)', async () => {
  limpar();
  await criar(post('{"__proto__": {"admin": true, "valor": 0.01}, "constructor": {"prototype": {"x": 1}}}'));
  await criar(post(JSON.stringify(pix()).replace('{', '{"__proto__":{"isAdmin":true},')));
  const vazio: Record<string, unknown> = {};
  assertEquals(vazio.admin, undefined);
  assertEquals(vazio.isAdmin, undefined);
  assertEquals(vazio.x, undefined);
});
