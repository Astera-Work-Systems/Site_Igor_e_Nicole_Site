# Upload de imagens compactadas no painel (03/10/2026)

## Problema
O cadastro de presentes só aceitava **link** de imagem. Muitos sites (Google Imagens, Shopee,
Mercado Livre, Instagram, Pinterest…) bloqueiam o uso das fotos deles em outros sites, ou o link
copiado é da *página* e não da *imagem*. Resultado: a foto não aparecia.

## O que mudou
- No formulário de presente do painel apareceu o botão **"Enviar foto do computador/celular"**.
- Antes de enviar, o **próprio navegador compacta a foto**:
  - redimensiona para no máximo **800 px** no lado maior (os cards da vitrine são menores que isso);
  - converte para **WebP** (ou JPG em navegadores antigos);
  - vai baixando a qualidade até ficar com **até ~120 KB**. Na prática, uma foto de celular de
    3–5 MB vira algo entre 30 e 100 KB.
- A foto vai para o **Supabase Storage** (bucket `presentes`). O banco de dados continua guardando
  só o link (texto), então **não pesa nada no banco**. O plano grátis do Supabase tem 1 GB de
  Storage: dá para milhares de fotos desse tamanho.
- O campo de link continua existindo, como alternativa.
- Tem uma **prévia** da imagem no formulário. Se o link colado não abrir, aparece um aviso
  sugerindo salvar a foto e usar o botão de envio.
- **Limpeza automática:** ao trocar a foto de um presente, excluir o presente ou cancelar a edição,
  as fotos que não são mais usadas são apagadas do Storage. Links externos nunca são mexidos.

## Segurança
- Qualquer visitante **vê** as imagens (precisa, para a vitrine).
- Só quem está na tabela `admins` pode **enviar, trocar, listar ou apagar** imagens.
- O bucket aceita só imagens (WebP, JPG, PNG) de até 1 MB, como barreira extra.

## Arquivos
- `src/lib/utils/imagem.ts` (novo): compactação no navegador.
- `src/lib/admin.ts`: `enviarImagemPresente()` e `removerImagemPresente()`; `excluirPresente()`
  agora também apaga a foto.
- `src/components/AdminPanel.tsx`: botão de envio, prévia, aviso de link quebrado e limpeza.
- `supabase/migrations/20261003120000_storage_imagens_presentes.sql` (novo): cria o bucket e as
  permissões.

## O que você precisa fazer
1. **Rodar a migração no Supabase:** abra *SQL Editor*, cole o conteúdo de
   `supabase/migrations/20261003120000_storage_imagens_presentes.sql` e clique em *Run*
   (ou `supabase db push`, se usar a CLI).
2. Conferir em *Storage* que o bucket **presentes** apareceu marcado como *Public*.
3. Publicar o site de novo (o build já foi testado e passou).
4. Testar: painel → Editar presente → Enviar foto → Salvar → ver na vitrine.

Não há variável de ambiente nova.

## Observações
- As fotos de exemplo já cadastradas (Pexels) continuam como link e funcionam normalmente.
  Se quiser trocar alguma, é só editar e enviar a foto nova.
- A foto do casal na página inicial (`HeroSection.tsx`) ainda é um link fixo no código.
  Se quiserem usar uma foto de vocês, dá para colocar o arquivo compactado na pasta `public/`
  do projeto; é só me mandar a foto.
