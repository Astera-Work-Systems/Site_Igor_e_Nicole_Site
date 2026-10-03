# Prévia do link no WhatsApp (03/10/2026)

## Problema
Ao compartilhar o link do site no WhatsApp, aparecia uma imagem escrita **"bolt"**.
O projeto nasceu no Bolt e o `index.html` ainda apontava a imagem de prévia (`og:image`)
para a imagem padrão do Bolt.

## O que mudou
- Nova imagem de prévia: `public/og-image.jpg` (1200×630, 47 KB, nas cores do site),
  com "Chá de Panela · Igor & Nicole · 10 de Abril de 2027".
- `index.html`: removidas as tags do Bolt e adicionadas as tags de prévia (título, descrição,
  imagem, tamanho, idioma) usadas por WhatsApp, Instagram, Facebook, Telegram e X.

- Endereço da imagem e `og:url` usam o domínio `https://igor-e-nicole.vercel.app/`.
  Se um dia mudarem para um domínio próprio, é preciso atualizar essas duas linhas no `index.html`.

## Depois de publicar
O WhatsApp guarda a prévia antiga por um tempo. Para ver a nova na hora, compartilhe o link
com algo no final, por exemplo `https://igor-e-nicole.vercel.app/?v=2`. Para forçar a atualização no
Facebook/Instagram, use https://developers.facebook.com/tools/debug/ e clique em "Coletar novamente".
