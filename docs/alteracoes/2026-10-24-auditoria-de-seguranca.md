# Auditoria de segurança (checklist "Black October")

**Data:** 24/10/2026

Segui as 4 etapas das instruções, adaptadas ao que o site é de fato. Ele **não tem servidor
Node/Express**: o front é React estático na Vercel e o "back-end" são Edge Functions do Supabase
(Deno). Por isso o Helmet e o express-rate-limit não se aplicam diretamente. Implementei o
equivalente de cada um no lugar certo (Vercel e Edge Functions).

---

## Resumo

| # | Item do checklist | Antes | Depois |
|---|---|---|---|
| 1 | Node.js | 24.14.0, com 19+ CVEs conhecidas (5 altas) | **24.22.1 LTS** (versão de segurança de 20/10), sem CVE pendente |
| 1 | `npm audit` | **22 vulnerabilidades** (14 altas) | **0** |
| 2 | Cabeçalhos (Helmet) | Nenhum (sem CSP, sem anti-clickjacking) | CSP + 7 cabeçalhos no `vercel.json` |
| 2 | Rate limit | Nenhum | Por IP nas 3 funções públicas |
| 2 | CORS | `*` (qualquer site) | Só o domínio do site (+ localhost) |
| 3 | Versões | `^` em tudo; Edge Functions com `@2` solto | Tudo fixado; lock só com pacotes de 14+ dias |
| 3 | Monitoramento contínuo | Nenhum | Dependabot com espera de 14 dias |
| 4 | Validação (zod) | Manual, com brechas | zod em todas as entradas + regras amigáveis |
| 4 | ReDoS / Event Loop | — | Testado: nenhum problema |

---

## 1. Ambiente

### Node.js
- `npx node-vulnerable`, como está nas instruções, **não existe no npm** (erro 404).
  **Não rodei** esse comando. Se alguém registrar esse nome, quem rodar `npx node-vulnerable` executa
  código desconhecido. É exatamente o golpe de *typosquatting* do item 3. A ferramenta certa é
  **`is-my-node-vulnerable`**, do Rafael Gonzaga, que é do time do Node.js.
- O Node 24.14.0 tinha várias CVEs (TLS, HTTP, HTTP/2, WebCrypto). Atualizei para o **24.22.1 LTS**
  pelo `winget`, com o instalador oficial do nodejs.org e o hash verificado. Depois disso o
  `is-my-node-vulnerable` não aponta mais nada.
- Observação: esse Node só roda no seu PC (para o build). O site em produção não usa Node.
  Mesmo assim, valia atualizar.

### npm audit: de 22 para 0
- `npm audit fix` resolveu 13 sem quebrar nada.
- O resto exigia trocar a versão de pacotes de build. Fiz isso **sem pular de versão principal**
  onde dava:
  - `vite` 5.4 → **6.4.4** (o `--force` sugeria a 8, que muda muita coisa)
  - `@vitejs/plugin-react` → 4.7.0 · `eslint` / `@eslint/js` → 9.39.5 · `typescript-eslint` → 8.71.1
  - `postcss-selector-parser` (vem dentro do Tailwind 3) forçado para 7.1.6 via `overrides`.
    O `--force` sugeria migrar para o Tailwind 4, o que mexeria nas cores e no visual do Pedro.
    **Testei: o CSS gerado ficou idêntico byte a byte** (41.994 bytes) antes e depois.

---

## 2. Cabeçalhos e requisições

### Cabeçalhos seguros (o "Helmet" do site): `vercel.json` (novo)
Hoje o site no ar não manda nenhum desses cabeçalhos. Depois do deploy, ele passa a mandar:
- **Content-Security-Policy**: o navegador só executa scripts do próprio site, só conecta no
  Supabase e só carrega fontes do Google. Bloqueia XSS e o envio de dados para sites estranhos.
- **X-Frame-Options: DENY** + `frame-ancestors 'none'`: ninguém consegue embutir o site num
  iframe (clickjacking, por exemplo um site falso por cima do botão "Pagar").
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`,
  `Permissions-Policy` (câmera, microfone, localização desligados), `Cross-Origin-Opener-Policy`.
- Cache longo para `/assets/` (os nomes já mudam a cada build).

### CORS restrito: `supabase/functions/_shared/http.ts`
- Antes: `Access-Control-Allow-Origin: *`, ou seja, **qualquer site** podia chamar as funções pelo
  navegador do visitante.
- Agora: só `https://igor-e-nicole.vercel.app` e o `localhost` do `npm run dev`/`preview`.
  Navegador vindo de outro domínio recebe **403 antes de tocar no banco ou no Asaas**.
- Para mudar o domínio (ex.: domínio próprio), use a variável `ALLOWED_ORIGINS` (veja o Deploy).

### Limite por IP (o "express-rate-limit"): `http.ts` + migração nova
| Função | Limite por IP | Por quê |
|---|---|---|
| `criar-contribuicao` | 15 a cada 10 min | Cada reserva trava o presente por 30 min. Sem limite, um robô reservava a lista inteira. |
| `status-contribuicao` | 300 a cada 10 min | A tela do Pix consulta a cada 5 s (120 em 10 min); sobra folga para 2 abas. |
| `enviar-recado` (nova) | 5 a cada 10 min | Antes, qualquer um podia encher o mural sem limite. |

- O contador fica no banco (`limites_requisicao`), porque as Edge Functions rodam em várias
  instâncias ao mesmo tempo.
- **LGPD:** não guardo o IP, só um hash SHA-256 dele. Contadores com mais de 1 dia são apagados
  sozinhos.
- Se o contador falhar, a requisição **passa**. O limitador nunca derruba um pagamento.
- Quem passa do limite recebe a mensagem "Muitas tentativas seguidas. Aguarde alguns minutos e
  tente de novo." (HTTP 429).

### Mural de recados: brecha fechada
- **Antes:** o navegador fazia `INSERT` direto na tabela `recados` com a chave pública. Dava para
  mandar milhares de recados com um script.
- **Agora:** o recado passa pela nova Edge Function `enviar-recado` (validação + limite). A
  migração remove a permissão de INSERT anônimo. A leitura do mural continua igual.

### Erros do banco não vazam mais
- Antes, `criar-contribuicao` devolvia ao navegador qualquer erro do Postgres, por exemplo
  `permission denied for table...`, que revela a estrutura do banco.
- Agora só passam as mensagens que nós mesmos escrevemos ("Este presente já foi garantido...").
  O resto vira "Não foi possível reservar este presente agora".

---

## 3. Cadeia de suprimentos

- **Versões fixas:** todo `^` do `package.json` saiu, e cada pacote tem a versão exata.
  O `.npmrc` (novo) com `save-exact=true` faz os próximos `npm install` também fixarem a versão.
- **Edge Functions:** `npm:@supabase/supabase-js@2` baixava **a 2.x mais nova a cada deploy**,
  qualquer que fosse. Fixei em `2.117.3`. O zod também está fixo (`3.25.76`).
- **Quarentena de 14 dias:** em pleno "Black October", recriei o `package-lock.json` com
  `npm install --before=2026-10-10`. Conferi os 298 pacotes: **nenhum publicado depois de 10/10**.
  Exemplo: o `vite@6.4.5` saiu há 3 dias, então usei o 6.4.4, de 06/10.
- **Assinaturas:** `npm audit signatures` mostra todos os pacotes com assinatura do registro
  verificada.
- **Typosquatting:** conferi os nomes de tudo que instalei, e o caso do `node-vulnerable` está
  no item 1.
- **Scripts de instalação:** o npm 11.19 (veio com o Node novo) bloqueia scripts de `postinstall`
  por padrão. O único pacote que tem um é o `esbuild`, e ele funciona sem (o build passou).
  Deixei bloqueado.
- **Monitoramento contínuo:** `.github/dependabot.yml` (novo). O GitHub avisa de vulnerabilidades
  e abre PRs semanais de atualização, mas **só de versões com 14+ dias** (`cooldown`).
  Nada atualiza sozinho: cada PR é revisado. O Snyk faz algo parecido, mas exige cadastro.
  Se quiser, é só conectar o repositório em snyk.io.
- Novo atalho: `npm run seguranca` (audit + assinaturas).

---

## 4. Validação e Event Loop

### zod nas Edge Functions: `supabase/functions/_shared/validacao.ts` (novo)
Toda entrada é conferida **antes** de chegar ao banco ou ao Asaas:
- `presente_id` e `id` precisam ser UUID. Tentativas como `1' OR '1'='1` ou `../../` são
  recusadas.
- **Campos extras são recusados** (`.strict()`). Ninguém consegue mandar `valor: 0.01` ou
  `status: "confirmado"` junto. O preço sempre vem do banco.
- Tipos e tamanhos: quantidade inteira de 1 a 100, parcelas de 1 a 24, textos com tamanho máximo
  (um nome de 10 mil letras ou uma mensagem de 100 mil é recusado de cara).
- Corpo que não é JSON, `null` ou lista: antes podia quebrar a função com erro 500.
  Agora responde "Requisição inválida."
- As mensagens amigáveis continuam iguais: CPF inválido, nome completo, WhatsApp com DDD.

### Open Redirect
O site não redireciona para endereços vindos do usuário. O único link externo dinâmico é a
página de pagamento, que vem do nosso servidor (devolvida pelo Asaas). O roteamento é só por `#/admin`.

### ReDoS e Event Loop
- A única expressão regular não trivial do servidor (a que mascara CPF nos logs) foi testada com
  entradas maliciosas de até 50 mil caracteres: **≤ 1 ms**.
- Nenhuma função usa operações síncronas pesadas (`*Sync`, criptografia bloqueante). O hash do IP
  usa `crypto.subtle` (assíncrono).

---

## Como foi testado

Nada de teste criou cobrança real, mexeu no banco de produção ou fez deploy.

### 1. Edge Functions: 28 testes + 4 de fuzzing (`supabase/tests/edge-functions.test.ts`, novo)
Banco e Asaas simulados. Para rodar de novo: `npm run test:funcoes`.
**Resultado: 28 passaram, 0 falharam.**
- **CORS:** preflight do site liberado; outro domínio, domínio parecido
  (`igor-e-nicole.vercel.app.malicioso.com`) e origem `null` recebem 403 **sem nenhuma chamada**
  ao banco ou ao Asaas; o `*` sumiu; GET/PUT → 405; `nosniff` e `no-store` nas respostas.
- **Validação:** 6 corpos malformados, 5 ids maliciosos, 4 tentativas de campo extra (preço,
  status) e 10 tipos/tamanhos errados, todos recusados antes do banco. CPF, nome e WhatsApp
  continuam com a mensagem amigável.
- **Erros do banco:** mensagem de negócio chega ao convidado; `permission denied` não vaza.
- **Funcionalidade:** Pix gera a cobrança com o valor **do banco** e devolve o copia-e-cola;
  "pessoalmente" confirma sem CPF e sem Asaas; o formato que o front manda (com `null`) passa;
  o status confirma e devolve os cupons sem dados pessoais; o recado é gravado sem espaços nas pontas.
- **Limite:** a 16ª reserva do mesmo IP → 429 com `Retry-After`, e outro IP continua normal; a
  requisição bloqueada não chega à reserva; recado bloqueia na 6ª; o status aguenta 300 consultas
  (o polling); contadores separados por rota; IP só em hash; se o contador falhar, o pagamento passa.
- **Webhook:** sem token, com token errado ou de outro tamanho → 401; token certo → reconsulta o
  Asaas e confirma; evento forjado dizendo "pago" **não** confirma se o Asaas diz pendente.

### 2. Migração SQL: 20 testes num Postgres real em memória (PGlite)
Simulei os papéis do Supabase (`anon`, `authenticated`, `service_role`) e a tabela `recados` como
está hoje. **Resultado: 20 passaram.**
- Prova da brecha: **antes** da migração, o anônimo inseria recado direto.
- Depois: anon/authenticated **não inserem, não alteram, não apagam** recado, mas continuam
  **lendo** o mural; não leem a tabela de limites nem chamam a função do limite.
- A Edge Function (service_role) grava recado; o limite conta certo (3 → bloqueia a 4ª); IPs e
  rotas têm contadores separados; a janela reinicia depois de 10 min; a faxina apaga contadores
  com mais de 1 dia; os recados antigos são preservados; a migração pode rodar 2 vezes sem erro.

### 3. Navegador real (Chrome, tela de celular), com os cabeçalhos do `vercel.json`
Servi o build com exatamente os cabeçalhos que a Vercel vai mandar.
- **Modo demonstração, 17 verificações (todas OK):** fontes do Google, 13 imagens, CSS e animações
  funcionando com a CSP; script injetado (XSS) **bloqueado**; envio de dados para domínio estranho
  **bloqueado**; nenhuma violação de CSP no uso normal; recado enviado aparece; recado com HTML
  aparece como texto (sem XSS); **checkout completo**: abrir presente → dados → "Gerar Pix" →
  copia-e-cola → confirmação (passo 3); outro site tentando abrir o nosso num iframe **bloqueado**;
  nenhum erro de JavaScript.
- **Build real ligado ao Supabase de produção (só leitura), 13 verificações (todas OK):**
  6 leituras do banco e **47 imagens do Storage** carregaram com a CSP, sem violação.
- **Painel admin:** a tela de login abre, a prévia de imagem (`blob:`) do upload funciona, sem
  violação de CSP nem erro de JS.

### 4. Segunda rodada (mais pesada)

**a) Banco inteiro, atacado em cada papel: 72/72.** As 10 migrações rodaram num Postgres real, em
ordem e sem erro. Depois ataquei como visitante (a chave pública do site), como usuário logado que
não é admin, como admin e como Edge Function:
- **Visitante e logado não-admin não conseguem:** ver contribuições (nome/WhatsApp), números da
  sorte ou admins; mudar preço, apagar ou criar presente; mudar a regra do sorteio; forjar
  contribuição confirmada; criar número da sorte; **se promover a admin**; escrever no mural;
  enviar arquivo ao Storage; chamar `reservar`, `confirmar`, `consumir_limite`; cancelar
  contribuição. Veem só os presentes ativos, e a vitrine não tem nenhuma coluna de dado pessoal.
- **Admin consegue** tudo do painel, mas **não** confirma pagamento na mão (só o Asaas) e só
  envia imagem para o bucket `presentes`.
- **Regras de negócio:** sem presente em dobro, a reserva vencida libera o presente, R$ 250 gera
  6 números, confirmar 2 vezes não duplica nada, e quantidade 0/negativa/acima do estoque é recusada.

**b) Prova de que os testes detectam as falhas.** Rodei a mesma suíte contra o código **antigo**:
**19 falham** (CORS, validação, vazamento de erro, mural, limite) e **9 passam** (Pix,
"pessoalmente", status, webhook). Os testes pegam os problemas reais, e o que já funcionava
continua igual.

**c) Fuzzing (`npm run test:funcoes`, agora com 32 testes).** 3.000 pedidos aleatórios e
maliciosos em `criar-contribuicao` e 1.500 em status/recado, com semente fixa (dá para repetir).
Nenhum 500, nenhuma mensagem vazando detalhe interno. Só chegou ao banco UUID válido e quantidade
de 1 a 100, e todas as 83 cobranças geradas usaram o valor do banco. JSON de 5 MB, com 50 mil
níveis ou com 100 mil chaves é recusado sem travar. `__proto__` não contamina nada.

**d) Ponta a ponta de verdade: 43/43.** As 4 Edge Functions rodando como **servidores HTTP reais**
(Deno), ligadas ao Postgres com todas as migrações e a um Asaas falso. O Chrome usou o site
compilado:
- **Convidado:** vitrine vinda do banco → checkout → Pix (QR Code e copia-e-cola) → "paga" no
  Asaas falso → o polling confirma → tela final com os números (R$ 180 = 4 números, conferido no
  banco). O presente pago via webhook aparece como "Garantido".
- **Mural:** 5 recados aparecem, o 6º mostra "Muitas tentativas seguidas..." e o banco tem
  exatamente 5. Um `<b>` no recado aparece como texto.
- **Webhook:** token errado → 401. Token certo dizendo "pago" sem o Asaas confirmar → **não**
  confirma. Depois do pagamento → confirma. Reenvio do Asaas não duplica números.
- **Ataques pelo navegador da vítima:** um site malicioso tentando chamar as funções com `fetch`
  é bloqueado. Com requisição "simples" `no-cors` ou formulário escondido (CSRF), o **servidor
  recusa**, nada é gravado e nem o limite do visitante é gasto. (No Supabase real, o gateway já
  exigiria o cabeçalho de autorização; esta é uma segunda camada.)
- **Chave pública direto no banco:** INSERT no mural recusado, leitura de contribuições vazia,
  `confirmar_contribuicao` recusado.

**e) Carga (Event Loop).** 300 corpos de 1 MB (30 em paralelo): todos 400, p95 367 ms.
Robô de 1 IP com 400 pedidos (40 em paralelo): **passaram exatamente 15**, 385 receberam 429,
nenhum 500. 1.000 consultas de status (50 em paralelo): todas 200, p95 209 ms.

Limite do teste: o Postgres em memória atende uma consulta por vez. A atomicidade sob concorrência
real vem do próprio Postgres (`INSERT ... ON CONFLICT DO UPDATE` no limitador e `SELECT ... FOR UPDATE`
na reserva), que é o comportamento padrão dele.

Os scripts da segunda rodada ficam na pasta temporária da sessão (dependem de caminhos desta
máquina). A suíte que fica no repositório é `supabase/tests/edge-functions.test.ts`.

### 5. Verificações gerais
`tsc` ✔ · `vite build` ✔ · `deno check` nas 4 funções ✔ · `npm audit` 0 ✔ · assinaturas ✔ ·
`eslint`: só os 3 erros antigos do `HeroSection.tsx` (veja "Para o Pedro").

---

## Status: publicado e testado em produção (24/10/2026)

Commit `881700a` na Vercel, as 4 funções publicadas às 13h32 e a migração aplicada.
Testes no ar, **sem criar Pix, cobrança nem recado** (só entradas que o servidor tem que recusar):
- **Funções (21/21):** CORS só para o site (outro domínio e domínio parecido → 403);
  JSON inválido, preço junto, injeção e CPF inválido recusados; a função chega ao banco real
  ("presente não está mais disponível"); webhook sem token ou com token errado → 401.
- **Banco com a chave pública (12/12):** não lê contribuições, cupons nem admins; não muda preço;
  não forja pagamento; não vira admin; **INSERT direto no mural barrado pela migração**
  (`permission denied`); não acessa o limitador.
- **Limite por IP no banco real:** o 6º pedido em 10 min recebeu 429, com `Retry-After` e CORS.
- **Chrome no site real (11/11):** vitrine, 48 imagens, fontes, visual, checkout abrindo, painel
  admin; XSS e envio para domínio estranho bloqueados; iframe de golpe bloqueado; sem violação de CSP.
- A chave **secreta** do Supabase não aparece no JavaScript do site (só a publicável, que é pública).

Falta só o teste humano: um Pix real de R$ 5 e um recado pelo celular.
Sugestão opcional: `autoComplete="username"`/`"current-password"` nos campos de login do painel
(o Chrome recomenda, para o gerenciador de senhas funcionar melhor).

## Deploy (**ordem importa**)

O front novo envia os recados pela função nova, e a migração tira o INSERT direto. Siga a ordem
abaixo para o mural não ficar fora do ar.

```bash
# 1) Edge Functions (as 3 que mudaram + a nova)
npx supabase@2.120.0 functions deploy criar-contribuicao
npx supabase@2.120.0 functions deploy status-contribuicao
npx supabase@2.120.0 functions deploy enviar-recado
npx supabase@2.120.0 functions deploy webhook-asaas --no-verify-jwt

# 2) Front: commit + push (a Vercel publica junto com o vercel.json)

# 3) Banco (cria o limitador e fecha o INSERT direto no mural)
npx supabase@2.120.0 db push --linked
```

- **Domínio:** se o site também abrir por outro endereço (domínio próprio, `www`...), configure
  **antes** do passo 1, senão o pagamento falha nesse endereço:
  `npx supabase@2.120.0 secrets set ALLOWED_ORIGINS=https://igor-e-nicole.vercel.app,https://seudominio.com.br`
  Links de *preview* da Vercel (`...-git-branch.vercel.app`) também ficam bloqueados para pagar.
  Para testar num preview, adicione o endereço dele nessa variável.
- **Vercel:** se o projeto estiver fixado no Node 18, mude para 20, 22 ou 24 (o Vite 6 pede
  ≥ 18, e o `package.json` pede ≥ 22.12).
- **CLI do Supabase:** use a versão fixa `supabase@2.120.0`. Em 24/10, o `npx supabase` sem versão baixou a 2.122.0, publicada no dia anterior (fora da regra dos 14 dias).
- **Depois do deploy**, um teste rápido no celular: abrir o site, mandar um recado e gerar um Pix
  de R$ 5.

---

## Recomendações (no painel do Supabase, sem código)

1. **Authentication → Sign In / Providers:** desligue **"Allow new users to sign up"**. Hoje
   ninguém vira admin sem estar na tabela `admins`, mas não há motivo para estranhos criarem conta.
2. **Authentication → Attack Protection:** ligue a **proteção contra senhas vazadas** e, se
   quiser, o **CAPTCHA** no login (o Supabase já limita tentativas de login por IP).
3. **Asaas:** confirme que o token do webhook é longo e aleatório (32+ caracteres).

## Decisão pendente (para os noivos)

- **"Vou dar pessoalmente" confirma na hora, sem pagamento.** Com o limite novo, um robô consegue
  no máximo 15 reservas a cada 10 min por IP. Antes era ilimitado. Alguém com muitos IPs ainda
  conseguiria marcar presentes como "garantidos" com nomes falsos. Hoje o remédio é cancelar no
  painel. Se isso preocupar, dá para exigir confirmação pelo WhatsApp ou deixar a opção só nos
  presentes menores (o que já é configurável).

## Para o Pedro (não mexi)

Continuam as mesmas do relatório de 22/10:
- **Data:** `index.html` diz **11 de abril**, mas `EVENT_DATE` (`src/data/mockData.ts`) diz **10 de abril**.
- **Lint:** `HeroSection.tsx` importa `Sparkles`, `EVENT_DATA_TEXTO` e `EVENT_HORA_TEXTO` sem usar
  (3 erros no `eslint`).
- **Cor:** `tailwind.config.js` tem `warm: '#f6f6f6  '` com espaços no fim.

## Arquivos

**Novos:** `vercel.json`, `.npmrc`, `.github/dependabot.yml`,
`supabase/functions/_shared/validacao.ts`, `supabase/functions/enviar-recado/index.ts`,
`supabase/migrations/20261024120000_limite_requisicoes.sql`, `supabase/tests/edge-functions.test.ts`

**Alterados:** `package.json`, `package-lock.json`, `.env.example`,
`supabase/functions/_shared/http.ts`, `supabase/functions/_shared/db.ts`,
`supabase/functions/criar-contribuicao/index.ts`, `supabase/functions/status-contribuicao/index.ts`,
`src/lib/api.ts`, `src/components/MuralRecados.tsx`
