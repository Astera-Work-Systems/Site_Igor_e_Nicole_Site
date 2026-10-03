# Valor livre com mínimo de 1 centavo (03/10/2026)

## O que mudou
- No formulário do painel, o "Valor mínimo por pessoa" dos presentes de **valor livre** aceita
  a partir de **R$ 0,01** (antes o campo travava em R$ 1,00).
- Se o campo ficar **em branco**, o presente é salvo com mínimo de **R$ 0,01**. Vale também para
  o "Adicionar vários".
- Migração `20261003130000_minimo_valor_livre_centavo.sql`: os presentes livres que já existem e
  estavam sem mínimo passam para R$ 0,01. Quem tem um mínimo definido não muda.

## Arquivos
- `src/components/AdminPanel.tsx`: campo do mínimo aceita 0,01 e explica o padrão.
- `src/lib/admin.ts`: grava 0,01 quando o mínimo do valor livre fica vazio.
- `supabase/migrations/20261003130000_minimo_valor_livre_centavo.sql` (novo).

## O que você precisa fazer
1. Rodar a migração no **SQL Editor** do Supabase.
2. Publicar o site de novo.

## Atenção: taxas do Asaas
- Cada pagamento recebido tem uma taxa do Asaas (Pix costuma ser **R$ 1,99** por cobrança no
  plano padrão; cartão tem taxa fixa + percentual). Num presente de R$ 0,01 a taxa fica maior
  que o valor, ou seja, **o casal paga para receber**. Vale conferir as taxas da conta de vocês.
- O Asaas pode ter um valor mínimo por cobrança. Se recusar um valor muito baixo, o site cancela
  a reserva sozinho e mostra ao convidado "Não conseguimos gerar o pagamento agora", sem
  travar o presente. Se isso acontecer, basta subir o mínimo no painel (ex.: R$ 5,00).
