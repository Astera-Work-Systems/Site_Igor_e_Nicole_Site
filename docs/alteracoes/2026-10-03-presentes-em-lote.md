# Cadastro de vários presentes de uma vez (03/10/2026)

## Problema
Cadastrar presente por presente no formulário era demorado.

## O que mudou
Na aba **Presentes** do painel apareceu o botão **"Adicionar vários"**, que funciona em 3 passos:

1. **Colar a lista.** Um presente por linha, no formato `Nome; Valor; Quantidade; Categoria`.
   Só nome e valor são obrigatórios. Exemplo:
   ```
   Jogo de panelas; 299,90; 2; Cozinha
   Air fryer; 450
   Cota da geladeira; 100; 10; Cotas Grandes
   Toalhas de banho; R$ 89,90; 3; Cama & Banho
   ```
   - Dá para copiar direto de uma planilha (Excel ou Google Planilhas) com as colunas nessa ordem.
   - O valor aceita `1.299,90`, `R$ 89,90`, `1.000` (mil) ou `450`.
   - Se a categoria não for informada ou não existir, usa a categoria escolhida no campo
     "Categoria quando não informada".
   - "Cotas Grandes" já entra como **cotas**; o resto entra como **presente inteiro**.
2. **Conferir numa tabela.** Dá para corrigir nome, modo (inteiro/cotas/livre), valor, quantidade
   e categoria ali mesmo, ou tirar um item da lista. Embaixo aparece o total da lista.
3. **Fotos.** O botão **"Escolher várias fotos de uma vez"** aceita várias fotos juntas. Elas entram
   **na ordem da lista**, nos presentes que ainda estão sem foto. Dá para clicar numa foto para
   trocar. Todas são compactadas automaticamente, como no cadastro individual.

Depois é só clicar em **"Salvar N presentes"**. Tudo é salvo de uma vez: se der erro, nenhum
presente é criado, para não ficar a lista pela metade. Fotos de itens removidos da lista ou de
um cadastro cancelado são apagadas do Storage.

Os presentes entram visíveis na vitrine e, quando são "inteiros", aceitam "Vou dar pessoalmente"
(igual ao padrão do formulário individual). Para mudar isso em algum, é só editar depois.

## Arquivos
- `src/components/AdminPresentesEmLote.tsx` (novo): a tela de cadastro em lote.
- `src/components/AdminPanel.tsx`: botão "Adicionar vários".
- `src/lib/admin.ts`: `criarPresentes()` salva a lista inteira numa única operação.

## O que você precisa fazer
- Nada no banco: usa as mesmas tabelas e permissões. As fotos dependem da migração do Storage
  (`20261003120000_storage_imagens_presentes.sql`, ver `2026-10-03-upload-imagens-compactadas.md`).
- Publicar o site de novo.

## Dica
Para as fotos caírem no presente certo, salve-as numeradas na mesma ordem da lista
(`01-panelas.jpg`, `02-airfryer.jpg`...). O sistema ordena as fotos pelo nome do arquivo
(entendendo números: `2` vem antes de `10`) antes de distribuir.
