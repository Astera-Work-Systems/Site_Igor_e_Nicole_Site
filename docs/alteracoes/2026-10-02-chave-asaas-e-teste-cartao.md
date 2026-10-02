# Configuração — 02/10/2026 · Chave do Asaas e teste do cartão

Nenhuma linha de código foi alterada. Este registro é só da **configuração**.

## Problema
Ao testar o pagamento com cartão, o site mostrou: *"Não conseguimos gerar o pagamento agora. Tente novamente em instantes."*

No log da Edge Function `criar-contribuicao` (Supabase → Edge Functions → Logs) estava o motivo real:

```
Error: Asaas 401 em /customers?...: A chave de API fornecida é inválida
```

## Causa
O secret `ASAAS_API_KEY` não estava vazio, mas tinha um valor inválido. Os hashes do `supabase secrets list` mostraram que o `ASAAS_BASE_URL` estava certo (`https://api.asaas.com/v3`).
O mais provável é a pegadinha do PowerShell: a chave começa com `$aact_prod_...`. Colada entre aspas duplas, o PowerShell trata o começo como variável e apaga essa parte.

## Correção
Secret salvo de novo com **aspas simples**:

```powershell
npx supabase secrets set 'ASAAS_API_KEY=$aact_prod_...'
```

O secret vale na hora, sem novo deploy. ✅ Pagamento com cartão testado e funcionando.

## Observações
- **CPF do noivo na fatura do Asaas:** o rodapé da página de pagamento mostra o nome e o CPF do titular da conta ("Esta cobrança é de responsabilidade única e exclusiva de..."). Isso é padrão do Asaas para conta de pessoa física e não dá para tirar pela API. Para esconder: conta com CNPJ (MEI) ou perguntar ao suporte do Asaas. **Decisão do noivo.**
- **CPF dos convidados nos logs:** quando o Asaas dá erro, o log da função grava a URL `/customers?cpfCnpj=...` com o CPF completo. Para a LGPD, o ideal é mascarar isso em `supabase/functions/_shared/asaas.ts`. **Pendente.**
- **Repositório público:** pode abrir. Nenhum segredo aparece no histórico (o `.env` nunca foi commitado). Antes, ative o *Secret scanning* e o *Push protection* do GitHub. Os telefones de `src/data/mockData.ts` já aparecem no site publicado.

## Pendências
- [ ] Mascarar o CPF nos logs das Edge Functions.
- [ ] Noivo decidir sobre o CPF na fatura (manter, MEI ou suporte do Asaas).
- [ ] Pix: continua dependendo do noivo cadastrar uma chave Pix no Asaas.
