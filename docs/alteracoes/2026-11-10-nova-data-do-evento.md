# Nova data do evento: 11 de abril de 2027, às 17h

Pedido do Pedro: mudar a data do Chá de Panela para **11 de abril às 17h** em todos os lugares do site.

## O que mudou

- **`src/data/mockData.ts`**: `EVENT_DATE` passou de `2027-04-10 18:00` para `2027-04-11 17:00` (horário de Brasília).
  Todos os textos do site saem dessa linha, então mudaram juntos:
  - Topo da página (Hero): "11 de Abril de 2027 · 17h00"
  - Contagem regressiva: agora conta até 11/04 às 17h, com o texto "11 de Abril de 2027 às 17h00"
  - Seção de local: "11 de Abril de 2027 / A partir das 17h00"
  - Rodapé, pergunta do sorteio no FAQ, tela de confirmação do presente e painel do admin
- **`public/og-image.jpg`** (a imagem que aparece quando alguém manda o link no WhatsApp): estava escrito "10 de Abril de 2027". Troquei só o texto da data por "11 de Abril de 2027", na mesma fonte, cor e posição. O resto da imagem ficou igual.
- **`index.html`**: as descrições do link já diziam "11 de Abril de 2027" e não mudaram. Só coloquei `?v=2` no endereço da imagem de prévia. Sem isso, o WhatsApp e as outras redes continuariam mostrando a imagem antiga, que elas guardam em cache.

## Conferido

- O TypeScript não acusou erros e o build de produção passou.
- Os textos gerados pela nova data são "11 de abril de 2027" e "17h00".

## Correção extra (pedida depois)

- A imagem de prévia ainda dizia **"Cotas"**, mas as cotas saíram do site em 03/10. Agora o rodapé dela diz só "Lista de presentes · Sorteio especial", centralizado, com a mesma fonte e cor.
- O endereço da imagem no `index.html` passou para `?v=3`, para o WhatsApp buscar a versão nova.

## Para o Pedro

- O ano ficou **2027**, porque era o que já estava no site. Se for outro ano, é só avisar.
- Links que já foram mandados no WhatsApp antes podem continuar com a prévia antiga nas conversas antigas. Nos envios novos, a prévia já sai certa.
