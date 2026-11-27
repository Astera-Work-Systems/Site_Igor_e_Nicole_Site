# 27/11/2026 — Ajustes de texto pedidos pelo Igor

## O que foi pedido
1. Trocar "Ajude a montar nosso novo lar" por "Montando nosso novo lar".
2. Onde o site fala em "levar" o presente, usar "entregar pessoalmente".

## O que mudou

> Não havia a palavra "levar" no site. O termo usado era **"dar pessoalmente"**, então ele virou **"entregar pessoalmente"**.

| Onde | Antes | Depois |
|---|---|---|
| Título da página inicial (`HeroSection.tsx`) | Ajude a montar o nosso *novo lar* | Montando nosso *novo lar* |
| Botão no checkout (`CheckoutModal.tsx`) | Vou dar pessoalmente | Vou entregar pessoalmente |
| Botão de confirmar no checkout | Confirmar: vou dar pessoalmente | Confirmar: vou entregar pessoalmente |
| Selo no card do presente (`GiftVitrine.tsx`) | Pode dar pessoalmente | Pode entregar pessoalmente |
| Aviso acima da lista (`GiftVitrine.tsx`) | "Vou dar pessoalmente" | "Vou entregar pessoalmente" |
| FAQ (`mockData.ts`) | "Pode dar pessoalmente" / "Vou dar pessoalmente" | "Pode entregar pessoalmente" / "Vou entregar pessoalmente" |
| Painel admin (`AdminPanel.tsx`): card, filtro e checkbox | Vão dar / Vou dar pessoalmente | Vão entregar / Vou entregar pessoalmente |

## O que não mudou
- Só mudaram textos. A lógica, o banco de dados e os pagamentos estão iguais (o valor interno `pessoalmente` continua o mesmo).
- A mensagem do WhatsApp já dizia "vou entregar pessoalmente".

## Verificação
- `tsc --noEmit`: sem erros.
- `npm run lint`: 1 erro que já existia em `supabase/tests/edge-functions.test.ts` (uso de `any`). Não tem relação com esta mudança.
