# Varredura de bugs

**Data:** 22/10/2026

Revisei o site inteiro: Edge Functions, migrações do banco, checkout, vitrine, mural, painel admin e
as mudanças recentes de cores/data.

## Corrigido

### 1. Fechar o Pix sem querer perdia o pagamento (o mais importante)
`src/components/CheckoutModal.tsx`

Na tela do QR Code, um toque fora da janela (ou a tecla Esc) fechava tudo. O convidado perdia o QR Code,
e o presente ficava reservado no nome dele por 30 minutos. Se tentasse de novo, recebia
"já foi garantido por outro convidado".

Agora, na tela de pagamento, tocar no fundo ou apertar Esc não fecha mais. O X pergunta antes:
"Fechar o pagamento? Se você já pagou, aguarde a confirmação aqui." Nos outros passos o modal fecha
como antes.

### 2. Botão "Copiar" do Pix podia falhar calado
`src/components/CheckoutModal.tsx`

Alguns celulares e navegadores bloqueiam a cópia automática. Antes, o botão mostrava "Copiado!" sem ter
copiado nada. Agora, se a cópia automática falhar, ele tenta o método antigo e só mostra "Copiado!"
quando a cópia dá certo.

### 3. Cobrança "órfã" no Asaas quando algo falhava no meio
`supabase/functions/criar-contribuicao/index.ts`, `supabase/functions/_shared/asaas.ts`

Se a cobrança já tinha sido criada no Asaas e algo falhava logo depois (por exemplo, ao gerar o
QR Code), a reserva era cancelada, mas a cobrança continuava ativa no Asaas. Agora ela é apagada.
No parcelado, o parcelamento inteiro é apagado, não só a 1ª parcela.

### 4. "Vou dar pessoalmente" barrado em presente abaixo de R$ 5
`supabase/functions/criar-contribuicao/index.ts`

A regra "cada parcela precisa ter pelo menos R$ 5" também era aplicada à reserva presencial, que não tem
pagamento. Agora ela só vale para o cartão parcelado.

### 5. Cancelar contribuição no painel sem aviso de erro
`src/components/AdminPanel.tsx`

Se o cancelamento falhava (internet, sessão expirada), nada acontecia na tela. Agora aparece um aviso.

### 6. Busca com espaço no fim não achava nada
`src/components/GiftVitrine.tsx`

"Jogo " (com espaço, comum no teclado do celular) não encontrava "Jogo de Pratos". Agora encontra.

### 7. Presente em dobro com Pix antigo
`supabase/functions/_shared/sincronizar.ts`, `supabase/functions/criar-contribuicao/index.ts`

O problema: a reserva expirava em 30 min, outra pessoa comprava o presente e depois a primeira pagava
o Pix antigo. Os dois pagamentos valiam, e o presente era dado duas vezes.

Agora, antes de reservar um presente, o servidor olha as reservas antigas dele que passaram do prazo
sem pagamento. Para cada uma:
- **apaga a cobrança no Asaas** (Pix ou cartão; no parcelado, o parcelamento inteiro), para o
  pagamento antigo não poder mais ser feito;
- **cancela a reserva**. A tela de quem estava com o Pix aberto mostra "O pagamento foi cancelado
  ou expirou".

Se a cobrança antiga **já tinha sido paga**, ela é confirmada e o presente continua com quem pagou.
A nova pessoa recebe "já foi garantido". O mesmo vale se o pagamento cair enquanto o servidor tenta
apagar (o Asaas recusa apagar cobrança paga).

Se ninguém mais escolher o presente, nada muda: quem pagar depois dos 30 min ainda consegue.

Proteção extra: se mesmo assim cair dinheiro numa cobrança apagada, ela é confirmada em vez de
ignorada, e aparece no painel para os noivos resolverem (estorno).

Na tela do Pix, o aviso agora diz: "Depois disso, se outra pessoa escolher este presente, este
pagamento é cancelado."

## Inconsistências nas mudanças do Pedro (só avisar, não mexi)

- **Data:** o `index.html` (prévia do WhatsApp/Google) diz **11 de abril**, mas o `EVENT_DATE` em
  `src/data/mockData.ts` diz **10 de abril**. Contagem regressiva, FAQ e checkout usam o dia 10.
- **Lint:** `src/components/HeroSection.tsx` importa `Sparkles`, `EVENT_DATA_TEXTO` e
  `EVENT_HORA_TEXTO`, mas eles só são usados no trecho comentado. O `npm run lint` acusa 3 erros
  (o site funciona normalmente).
- **Cor com espaços:** `tailwind.config.js` tem `warm: '#f6f6f6  '` (dois espaços no fim). Hoje
  funciona, mas usar opacidade nessa cor (ex.: `bg-canvas-warm/50`) pode quebrar.
- **Contraste:** texto branco sobre `#cfb497` (botões como "Todos os presentes") e os títulos pequenos
  dourados ficam com contraste baixo (cerca de 2:1), difíceis de ler no celular ou no sol.

## Deploy

- Front (Vercel): basta o deploy normal.
- Edge Functions (itens 3, 4 e 7; as três usam o código compartilhado que mudou). **Feito em 22/10/2026.**
  ```
  npx supabase functions deploy criar-contribuicao
  npx supabase functions deploy status-contribuicao
  npx supabase functions deploy webhook-asaas --no-verify-jwt
  ```

## Como foi testado

- `tsc`, `eslint` nos arquivos alterados e `vite build` passando; `deno check` nas 3 Edge Functions passando.
- Teste em Deno com Asaas e banco simulados (nada real foi chamado), 7 cenários do item 7:
  - vencido e não pago: apaga e cancela;
  - parcelado: apaga o parcelamento inteiro;
  - já pago: confirma e não apaga;
  - pago no meio-tempo: confirma;
  - reserva sem cobrança: só cancela;
  - dinheiro em cobrança apagada: confirma;
  - a consulta filtra só pendentes vencidas do presente certo.
- Chrome headless em tela de celular, em **modo demonstração** (sem Supabase, para não criar cobrança
  real), com 13 verificações automáticas:
  - modal fecha pelo fundo/Esc no passo de dados;
  - **não** fecha pelo fundo/Esc na tela do Pix;
  - X + "Cancelar" mantém, X + "OK" fecha;
  - "Copiado!" aparece;
  - tela de sucesso fecha sem aviso;
  - rolagem liberada depois de fechar;
  - busca com espaço no fim;
  - nenhum erro de JavaScript.
- Varredura visual em celular e desktop: sem rolagem lateral, sem imagem quebrada, sem erro no console.
