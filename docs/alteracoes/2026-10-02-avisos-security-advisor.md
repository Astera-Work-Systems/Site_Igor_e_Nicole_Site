# Segurança — 02/10/2026 · Avisos do Security Advisor do Supabase

## Avisos
| Aviso | Item |
|---|---|
| Visitante sem login pode executar função SECURITY DEFINER | `public.is_admin()` |
| Usuário logado pode executar função SECURITY DEFINER | `public.is_admin()` |
| Usuário logado pode executar função SECURITY DEFINER | `public.cancelar_contribuicao(p_id uuid)` |
| Proteção contra senhas vazadas desativada | Auth |

## O que era o problema
Uma função SECURITY DEFINER roda com a permissão do dono do banco, e não com a de quem chama. As duas funções já se protegiam sozinhas:
- `is_admin()` só responde "você é admin?" sobre quem chama.
- `cancelar_contribuicao()` recusa quem não é admin.

Mesmo assim, o Supabase recomenda não deixar código com essa permissão acessível pela API. Se alguém mexer na função no futuro e errar, vira uma brecha.

## Correção — `supabase/migrations/20261002120000_funcoes_privadas.sql`
- O código com permissão de dono foi para o schema `private`, que a API do Supabase não expõe: `private.is_admin()` e `private.cancelar_contribuicao()`. É o mesmo padrão usado em `private.ocupacao_presentes()` na migration de 01/10.
- As funções em `public` continuam existindo com o mesmo nome, os mesmos parâmetros e o mesmo retorno. Agora são SECURITY INVOKER (rodam com a permissão de quem chama) e só repassam a chamada para a versão privada.
- **Nada muda no site, no painel admin, nas policies de RLS nem nas Edge Functions.**

## Testado
Rodei as 4 migrations num Postgres local e testei cada tipo de acesso:

| Teste | Resultado |
|---|---|
| Visitante: `is_admin()` | `false` ✅ |
| Visitante: vitrine | só presentes ativos ✅ |
| Admin: `is_admin()` | `true` ✅ |
| Admin: vitrine | inclui os presentes desativados ✅ |
| Outro usuário logado: `is_admin()` | `false` ✅ |
| Visitante tenta cancelar uma contribuição (pública ou privada) | permissão negada ✅ |
| Outro usuário logado tenta cancelar | "Sem permissão." ✅ |
| Admin cancela | cancelado, e os cupons do sorteio são apagados ✅ |
| Edge Function (service_role) cancela | cancelado ✅ |
| Visitante tenta alterar `contribuicoes` direto | nada alterado ✅ |
| Funções SECURITY DEFINER que sobraram em `public` | só `reservar_contribuicao` e `confirmar_contribuicao`, que já eram bloqueadas para visitante e logado (o Advisor não as acusa) ✅ |

## Como aplicar
```powershell
npx supabase db push
```
Depois, em **Supabase → Advisors → Security Advisor**, clique em **Refresh**.

## Proteção contra senhas vazadas
Esse aviso não depende de código. A opção fica em **Authentication**, nas configurações de senha, com o nome **"Prevent use of leaked passwords"**. O lugar exato muda conforme a versão do painel; clicar no aviso dentro do Advisor leva até ela. Ela confere se a senha já apareceu em vazamentos conhecidos (HaveIBeenPwned).
- **Só existe no plano Pro.** No plano gratuito, o aviso continua aparecendo e pode ser ignorado.
- Para este site, o risco é baixo. O único login é o dos noivos, e convidados não criam conta. O que importa é a senha do admin ser forte e não repetida de outro site.

## Pendências
- [ ] Rodar `npx supabase db push`.
- [ ] Clicar em Refresh no Security Advisor e confirmar que os 3 avisos sumiram.
- [ ] Conferir se a senha do admin é forte e única.
