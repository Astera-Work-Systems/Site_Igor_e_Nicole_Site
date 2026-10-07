# Número da sorte por presente (07/10/2026)

## Pedido
Como existem presentes abaixo de R$ 50, eles não davam nenhum número para o sorteio. A noiva pediu:
**cada presente dá 1 número**, e **a cada R$ 50 a mais do mesmo presente** ganha um adicional,
para não ficar injusto.

## Nova regra
Para cada unidade de presente:

> números = 1 + (quantos R$ 50 cabem no valor do presente)

| Presente | Antes | Agora |
|---|---|---|
| R$ 30 | 0 | **1** |
| R$ 49,90 | 0 | **1** |
| R$ 50 | 1 | **2** |
| R$ 99 | 1 | **2** |
| R$ 100 | 2 | **3** |
| R$ 150 | 3 | **4** |
| 2 unidades de R$ 30 | 1 | **2** |

- Vale **por unidade**: quem dá 2 unidades do mesmo presente ganha o dobro de números.
- Parcelado no cartão conta pelo valor total do presente, como antes.
- Quem dá **pessoalmente** continua seguindo a opção do painel ("Quem dá pessoalmente também
  ganha número da sorte").
- O valor de R$ 50 continua configurável no painel (campo **"+1 número da sorte a cada (R$)"**).

## Quem já presenteou
Ao aplicar a migração, as contribuições **já confirmadas** recebem os números que faltam pela regra
nova (ex.: quem deu um presente de R$ 30 ganha o seu número; quem deu R$ 100 ganha mais 1).
Nenhum número existente é apagado ou trocado — os novos entram no fim da sequência.

## Arquivos alterados
- `supabase/migrations/20261007120000_cupom_por_presente.sql` — nova função `cupons_por_regra`,
  `confirmar_contribuicao` passa a usá-la, e completa os números de quem já presenteou.
- `src/lib/utils/cupons.ts` — `calcularCupons` com a regra nova (prévia no checkout).
- `src/components/CheckoutModal.tsx`, `src/lib/api.ts` (modo demonstração) — usam a regra nova.
- Textos: `HeroSection.tsx`, `EventHighlights.tsx`, FAQ em `mockData.ts`, rótulo no `AdminPanel.tsx`.

## Para publicar
1. Rodar a migração no Supabase (`supabase db push` ou colar o SQL no SQL Editor).
2. Publicar o front (build passou sem erros).
