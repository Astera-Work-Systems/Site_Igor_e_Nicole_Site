# Fim das cotas e da vaquinha; parcelamento no cartão (03/10/2026)

## Pedido
Não vai ter cotas. Os presentes de valor alto podem ser parcelados no cartão. Também saiu o
**valor livre** (vaquinha): cada convidado dá o presente inteiro.

## O que mudou para o convidado
- Cada presente aparece com o **valor cheio**. Se puder ser parcelado, o card mostra
  *"ou até 12x de R$ X no cartão"*.
- No checkout, escolhendo **Cartão**, aparece **"Em quantas vezes?"** (à vista até o máximo
  configurado). Pix continua à vista.
- O parcelamento é **sem juros para o convidado**.
- Os números da sorte valem pelo **valor total** do presente, mesmo parcelado.
- O filtro "Cotas e vaquinhas" virou **"Acima de R$ 300"**.
- Textos da vitrine, do FAQ e da descrição do site (index.html) não falam mais de cotas.

## O que mudou no painel
- Saiu a escolha "Como o presente é dado" (Inteiro / Cotas / Valor livre). Agora é só
  **valor de 1 unidade** e **quantas unidades vocês querem**.
- A categoria **"Cotas Grandes"** saiu da lista.
- Em **Configurações**: novo campo **"Parcelar no cartão em até"** (de "Só à vista" até 12x, padrão 12x).
- Na aba Contribuições, pagamentos parcelados aparecem como *"em 3x no cartão"*.
- Cadastro em lote: saiu a coluna de modo.

## Regras do Asaas
- Cada parcela precisa ter **pelo menos R$ 5,00**. O site limita as opções sozinho
  (ex.: presente de R$ 20 = no máximo 4x).
- A **taxa do Asaas no parcelado é maior** que à vista e fica com os noivos (o convidado não paga juros).
  Confira os valores atuais no painel do Asaas. Para desligar o parcelamento, escolha "Só à vista".
- O convidado paga na página segura do Asaas, que cobra o parcelamento inteiro no cartão.
  Todas as parcelas mudam de status juntas, então o site acompanha só a 1ª. Estorno feito no
  painel do Asaas continua liberando o presente automaticamente.
- **Quando o dinheiro cai na conta** (parcela por parcela ou antecipado) é configurado pelo noivo
  no próprio Asaas. Isso não afeta o site: o presente é confirmado e os números da sorte são gerados
  assim que o cartão é aprovado, sem esperar o dinheiro cair.

## Banco de dados — migração `20261003150000_sem_cotas_parcelamento.sql`
- Presentes em **cotas** viram presente inteiro com o **valor total** (valor da cota × nº de cotas) e 1 unidade.
- Presentes em **valor livre** viram presente inteiro com a **meta** como valor e 1 unidade.
- Só o modo `inteiro` é aceito daqui para frente.
- Presentes da categoria "Cotas Grandes" vão para **"Eletrodomésticos"**.
- Novo `configuracoes.max_parcelas` (padrão 12).
- Novos `contribuicoes.parcelas` e `contribuicoes.asaas_installment_id`.

> **Atenção:** se algum presente de cotas ou de valor livre já tinha contribuições (mesmo de teste),
> depois da migração ele aparece como **"Já garantido"**. Confira no painel e, se for teste,
> cancele a contribuição na aba Contribuições.

## Arquivos
- `src/types/index.ts`: saem `ModoPresente`, `valor_minimo` e `valor_ocupado`; entram `parcelas` e `max_parcelas`.
- `src/lib/utils/presentes.ts`: lógica só de presente inteiro + `parcelasPermitidas()`.
- `src/components/CheckoutModal.tsx`: tira o valor livre e põe o seletor de parcelas.
- `src/components/GiftVitrine.tsx`, `src/App.tsx`: valor cheio, "até Nx" e novo filtro.
- `src/components/AdminPanel.tsx`, `src/components/AdminPresentesEmLote.tsx`, `src/lib/admin.ts`: sem modos; config de parcelas.
- `src/lib/api.ts`, `src/data/mockData.ts`, `index.html`: textos, demonstração e configuração padrão.
- `supabase/functions/_shared/asaas.ts`: cobrança parcelada (`installmentCount` + `totalValue`).
- `supabase/functions/criar-contribuicao/index.ts`: valida parcelas (máximo do painel e R$ 5,00 por parcela).
- `supabase/functions/webhook-asaas/index.ts`: ignora avisos da 2ª parcela em diante.
- `supabase/functions/_shared/db.ts`: campo `parcelas`.

## Para colocar no ar
1. Rodar a migração: `supabase db push`.
2. Publicar as funções:
   `supabase functions deploy criar-contribuicao` e
   `supabase functions deploy webhook-asaas --no-verify-jwt`.
3. Publicar o site (build novo).
4. Testar um pagamento parcelado no cartão (ex.: presente de R$ 10 em 2x).

## Verificação
- `npm run typecheck`, `npm run lint` e `npm run build`: sem erros.
- As Edge Functions não foram checadas com `deno check` (Deno não está instalado nesta máquina).
- O parcelamento real no Asaas ainda **não foi testado**: fazer o teste do passo 4.
