# Erro "Não conseguimos gerar o pagamento agora" e mínimo de R$ 5,00 (03/10/2026)

## Problema
No teste de pagamento apareceu: **"Não conseguimos gerar o pagamento agora. Tente novamente em
instantes."** Essa mensagem aparece sempre que o Asaas recusa a cobrança. O motivo exato fica no
log da Edge Function `criar-contribuicao`.

## Causa provável
O **Asaas não emite cobrança abaixo de R$ 5,00** no Pix nem no cartão (o boleto, que não usamos,
tem mínimo de R$ 10,00). Na alteração anterior liberamos o valor livre a partir de **R$ 0,01**,
então um pagamento de teste abaixo de R$ 5,00 é recusado.
(Fonte: https://help.sistemaquality.com.br/2026/09/28/quais-sao-os-valores-minimos-das-cobrancas-no-asaas-e-no-iugu
A documentação oficial do Pix do Asaas não cita mínimo, então vale confirmar pelo log.)

## O que mudou
- **Substitui** a alteração "Valor livre com mínimo de 1 centavo": o mínimo do valor livre volta a
  ser **R$ 5,00**, que é o menor valor possível pelo Asaas.
- Painel: o campo "Valor mínimo por pessoa" aceita a partir de R$ 5,00 e explica o motivo. Em branco = R$ 5,00.
- Vitrine e checkout: o valor livre sugere no mínimo R$ 5,00. Qualquer pagamento pelo site
  (inclusive presente inteiro ou cota de valor baixo) abaixo de R$ 5,00 mostra:
  *"Pagamentos pelo site precisam ser de pelo menos R$ 5,00 (regra do Asaas)."*
- Servidor (`criar-contribuicao`): confere o mínimo antes de chamar o Asaas, libera a reserva e
  devolve essa mesma mensagem clara, em vez do erro genérico.
- **"Vou dar pessoalmente" continua sem mínimo**, porque não passa pelo Asaas.
- Migração `20261003140000_minimo_valor_livre_asaas.sql`: presentes livres com mínimo abaixo de
  R$ 5,00 passam para R$ 5,00.

## Arquivos
- `src/lib/utils/presentes.ts`: `VALOR_MINIMO_PAGAMENTO = 5`.
- `src/components/CheckoutModal.tsx`: bloqueia pagamento abaixo do mínimo, com mensagem.
- `src/components/AdminPanel.tsx` e `src/lib/admin.ts`: mínimo do valor livre = R$ 5,00.
- `supabase/functions/_shared/asaas.ts`: `VALOR_MINIMO_ASAAS = 5`.
- `supabase/functions/criar-contribuicao/index.ts`: checagem no servidor.
- `supabase/migrations/20261003140000_minimo_valor_livre_asaas.sql` (novo).

## O que você precisa fazer
1. Rodar a migração no **SQL Editor** do Supabase (depois da `20261003130000`, se ainda não rodou).
2. Publicar a Edge Function: `npx supabase functions deploy criar-contribuicao`
3. Publicar o site de novo.
4. Testar com **R$ 5,00 ou mais**.

## Se o erro continuar com R$ 5,00 ou mais
A causa é outra. Veja o motivo em **Supabase → Edge Functions → criar-contribuicao → Logs**.
Procure a linha que começa com `Asaas 400` (ou outro número) e me mande o texto. CPF e telefone
já aparecem mascarados no log.
