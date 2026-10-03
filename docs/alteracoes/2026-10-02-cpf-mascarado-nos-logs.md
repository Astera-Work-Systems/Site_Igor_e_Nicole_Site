# Segurança — 02/10/2026 · CPF mascarado nos logs (LGPD)

## Problema
Quando o Asaas devolvia um erro, a mensagem ia para os logs das Edge Functions com o CPF completo do convidado. Exemplo:

```
Error: Asaas 401 em /customers?cpfCnpj=12345678901&limit=1: ...
```

## Correção
Em `supabase/functions/_shared/asaas.ts`, a nova função `semDadosPessoais()` limpa a mensagem de erro antes que ela chegue ao log.
- CPF, CNPJ e telefone, com ou sem pontuação, ficam só com os 2 últimos dígitos: `/customers?cpfCnpj=*********01`.
- IDs do Asaas (`pay_...`, `cus_...`), datas e valores ficam intactos. Assim ainda dá para investigar o erro.

Testado com: CPF puro, CPF com pontuação, CNPJ, telefone, ID de cobrança, ID de cliente, data e valor.

O comportamento do site não muda. Só a mensagem que vai para o log ficou diferente.

## Como publicar
A correção só vale depois do deploy das funções que usam o Asaas:

```powershell
npx supabase functions deploy criar-contribuicao
npx supabase functions deploy status-contribuicao
npx supabase functions deploy webhook-asaas --no-verify-jwt
```

> O `--no-verify-jwt` do webhook é obrigatório. Sem ele, o Asaas não consegue avisar o site dos pagamentos.

## Pendências
- [x] Mascarar o CPF nos logs das Edge Functions.
- [ ] Fazer o deploy das 3 funções (comandos acima).
- [ ] Noivo decidir sobre o CPF dele na fatura do Asaas (manter, MEI ou suporte do Asaas).
- [ ] Se o repositório for público: ativar *Secret scanning* e *Push protection* no GitHub.
- [ ] Hospedar o site e configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na hospedagem.
