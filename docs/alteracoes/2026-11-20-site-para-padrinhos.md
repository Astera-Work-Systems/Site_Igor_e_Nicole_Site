# Site voltado para os padrinhos — fim do Chá de Panela (20/11/2026)

## Pedido

Mensagem dos noivos (WhatsApp, 20/11):

- "Tirar do site tudo que se refere ao chá de panela: a contagem regressiva, a questão do sorteio, etc."
- "Vamos deixar o site mais voltado para os padrinhos."
- Nicole: "Pode permanecer o texto de que é só uma sugestão: pode presentear pelo site ou comprar onde quiser, por fora, presencial."
- Igor: não precisa de contagem para o jantar. Como o jantar será só com os padrinhos, o site também pode ser mandado para quem não é padrinho e perguntar o que eles querem.

## O que mudou

### Removido do site público
| Item | Onde estava |
|---|---|
| Contagem regressiva | `Countdown.tsx` (arquivo apagado) |
| Seção "Destaques do Evento Presencial" (lanche, agradecimento, sorteio) | `EventHighlights.tsx` (arquivo apagado) |
| Seção "Local do Evento" (data, hora e local do chá) | `LocationSection.tsx` (arquivo apagado) |
| Itens "Sorteio" e "Local" do menu | `Header.tsx` |
| Botão "Como Funciona o Sorteio" no topo | `HeroSection.tsx` (virou "Dúvidas Frequentes") |
| Textos sobre números da sorte (topo, vitrine, checkout, tela de sucesso) | `HeroSection.tsx`, `GiftVitrine.tsx`, `CheckoutModal.tsx` |
| Números da sorte na mensagem do WhatsApp | `lib/utils/whatsapp.ts` |
| Perguntas do FAQ sobre sorteio e sobre o "dia do evento" | `data/mockData.ts` |
| Data do chá no rodapé | `Footer.tsx` (ficou só "Gurupi, Tocantins") |

### Trocado
- "Chá de Panela" → **"Lista de Presentes"** no título da aba, no topo, no menu, no rodapé e na prévia de link do WhatsApp (`index.html`).
- O menu "O Evento" virou **"Início"**.
- Novo texto, pedido da Nicole, no topo, na vitrine e no FAQ: **"A lista é só uma sugestão: fique à vontade para comprar onde preferir e entregar pessoalmente."**

### Painel administrativo
- A aba **Sorteio** saiu.
- O card "Cupons Gerados" saiu do dashboard.
- As opções de número da sorte saíram das Configurações.

## O que NÃO mudou (de propósito)
- **Banco de dados e Edge Functions** estão iguais. O banco ainda gera "cupons" internamente a cada pagamento, mas isso não aparece em lugar nenhum. Não criei migração para não mexer em pagamento real sem necessidade. Se quiserem limpar a tabela `cupons_sorteio` depois, dá para fazer numa migração separada.
- Pix, cartão, parcelamento, "Vou dar pessoalmente", mínimo de R$ 5 e mural de recados continuam funcionando do mesmo jeito.

## Testes
- `tsc` (tipos): OK.
- `vite build` (build demo, sem chaves): OK.
- Página renderizada no Chrome headless: 0 ocorrências de "Chá de Panela", "sorteio", "sorte", "Contagem", "Local do Evento" e "2027". "Lista de Presentes" e "só uma sugestão" aparecem.
- `eslint`: OK (depois da limpeza do Hero).
- Não testado no navegador: clicar em "Presentear" e passar pelo checkout. O código do checkout passou no `tsc`, mas convém fazer um teste manual de Pix de R$ 5 depois do deploy.

## Visual (antes área do Pedro)
O Pedro perdeu o acesso ao GitHub, então o visual agora fica com a gente.
- `HeroSection.tsx`: o título virou **"Ajude a montar o nosso *novo lar*"**. Também apaguei os blocos comentados (badge de data e brilho decorativo) e os imports sem uso. Com isso o `eslint` volta a passar. Corrigi "inesquecivel" → "inesquecível". Cores, imagem e layout não mudaram.
- `public/og-image.jpg` (prévia do link): agora diz "LISTA DE PRESENTES · Igor & Nicole · Pix ou cartão parcelado", com a mesma fonte, cores e moldura. O WhatsApp pode mostrar a prévia antiga por um tempo, por causa do cache.

## Decisões pendentes
- Mostrar alguma informação do **jantar dos padrinhos** no site (data/local)? Hoje o site não mostra nenhum evento.
- Apagar de vez os dados de sorteio no banco (migração)?

## Arquivos alterados
`index.html`, `src/App.tsx`, `src/components/{AdminPanel,CheckoutModal,FAQ,Footer,GiftVitrine,Header,HeroSection}.tsx`, `src/data/mockData.ts`, `src/lib/admin.ts`, `src/lib/utils/whatsapp.ts`, `public/og-image.jpg`. Arquivos apagados: `Countdown.tsx`, `EventHighlights.tsx`, `LocationSection.tsx`.
