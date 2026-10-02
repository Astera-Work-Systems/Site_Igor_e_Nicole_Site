# Configuração — 01/10/2026 · Asaas em produção

Nenhuma linha de código foi alterada. Este registro é só da **configuração** feita para ligar o Asaas de verdade.

## Feito
| Item | Situação |
|---|---|
| Chave de produção do Asaas (conta do noivo) | ✅ Validada pela API (`/myAccount/status`) |
| Migration `20260924120000` no banco remoto | ✅ Aplicada |
| Secrets `ASAAS_API_KEY`, `ASAAS_BASE_URL` (produção) e `ASAAS_WEBHOOK_TOKEN` | ✅ Salvos no Supabase |
| Deploy de `criar-contribuicao`, `status-contribuicao` e `webhook-asaas` (`--no-verify-jwt`) | ✅ No ar (o webhook recusa requisição sem token, como esperado) |
| Webhook cadastrado no Asaas pela API | ✅ Criado, apontando para `.../functions/v1/webhook-asaas` |

## Situação da conta Asaas do noivo
| Item | Status | Impacto |
|---|---|---|
| Conta geral / documentos / dados comerciais | APPROVED | Pode receber |
| Conta bancária | **PENDING** | O dinheiro entra no Asaas, mas não dá para sacar até ele cadastrar e validar |
| Chave Pix | **Nenhuma** | **O Pix do site não funciona** (o Asaas não gera QR Code). O cartão funciona |

## Pendências
**Desenvolvedor**
- [ ] Criar o login dos noivos (Authentication → Add user + `insert into admins ...`) e desligar o cadastro público.
- [ ] Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na hospedagem e publicar.

**Noivo**
- [ ] Cadastrar uma chave Pix no Asaas (pode ser a aleatória).
- [ ] Cadastrar e validar a conta bancária no Asaas.
- [ ] Autorizar o teste real (R$ 5, depois estorno; a taxa do Asaas fica com ele).
- [ ] (Opcional) 50/50: a noiva cria uma conta Asaas e passa o `walletId`.

## Teste final (depois da chave Pix)
1. No painel `/#/admin`, criar um presente de teste de R$ 5.
2. No site, pagar com Pix.
3. Conferir se a tela confirma sozinha e se o presente aparece como pago no painel.
4. Estornar pelo painel do Asaas e conferir se o site libera de novo.
5. Apagar o presente de teste.

Se algo falhar: Supabase → Edge Functions → Logs.

## Correção do aviso do Security Advisor (Supabase)
**Aviso:** `View public.presentes_vitrine is defined with the SECURITY DEFINER property`.

**Por que existia:** a vitrine precisa mostrar quantas cotas já foram dadas, mas o visitante não pode ler a tabela `contribuicoes`, que tem nome e WhatsApp. Por isso a view rodava com permissão de dono.

**O que mudou** (nova migration `supabase/migrations/20261001120000_vitrine_security_invoker.sql`):
- A soma das contribuições foi para a função `private.ocupacao_presentes()`. Ela devolve **só os totais** por presente e fica no schema `private`, que a API do Supabase não expõe.
- A view agora é `security_invoker`, ou seja, respeita o RLS de quem consulta. O visitante vê só os presentes ativos e o admin vê todos, igual a antes.
- Aproveitei para corrigir outro aviso comum do Advisor ("Function Search Path Mutable"): fixei o `search_path` da função `contribuicao_ativa`.
- **O site não muda nada:** a view tem as mesmas colunas e devolve os mesmos resultados.

**Testado** num Postgres local com as 3 migrations:
- A view ficou `security_invoker=true`.
- O visitante vê só o presente ativo, com os totais certos (reserva expirada não conta).
- O visitante continua sem conseguir ler `contribuicoes` (0 linhas).
- O admin vê os presentes ativos e os inativos.

**Para aplicar:** `npx supabase db push`

## Lições
- No PowerShell, um valor que começa com `$` (como a chave do Asaas) precisa de **aspas simples** ou de uma variável (`"ASAAS_API_KEY=$k"`). Senão é salvo vazio.
- Ao colar várias linhas de uma vez, a linha seguinte vira resposta do `Read-Host`. Rode um comando por vez.
- Para conferir um secret sem expô-lo, compare o SHA-256 local com o que aparece no `supabase secrets list`.
