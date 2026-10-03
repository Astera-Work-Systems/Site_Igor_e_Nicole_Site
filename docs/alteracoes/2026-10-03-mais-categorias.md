# Mais categorias de presentes (03/10/2026)

## O que mudou
Categorias disponíveis no painel (formulário individual e "Adicionar vários"):

| Antes | Agora |
|---|---|
| Cozinha | Cozinha |
| Eletrodomésticos | Eletrodomésticos |
| | **Eletroportáteis** (air fryer, liquidificador, batedeira...) |
| Mesa Posta | Mesa Posta |
| Cama & Banho | Cama & Banho |
| | **Sala & Decoração** |
| | **Limpeza & Lavanderia** |
| | **Organização** |
| | **Eletrônicos** |
| | **Ferramentas & Utilidades** |
| | **Lua de Mel** |
| Cotas Grandes | Cotas Grandes |
| | **Outros** (o que não se encaixar em nenhuma) |

- Na **vitrine**, os botões de filtro mostram só as categorias que têm algum presente visível.
  Assim o convidado não clica numa categoria vazia.
- No "Adicionar vários", a coluna de categoria aceita qualquer um desses nomes (maiúsculas e
  minúsculas tanto faz).
- Os presentes que já existem não mudam. Para trocar a categoria, é só editar.

## Arquivos
- `src/data/mockData.ts`: lista `CATEGORIAS`. Para criar ou renomear uma categoria, é só mexer aqui.
- `src/components/GiftVitrine.tsx`: filtros só com as categorias em uso.
- `src/components/AdminPanel.tsx`: ao editar, um presente com categoria fora da lista continua
  mostrando a categoria dele, em vez de trocar sozinho para outra.

## O que você precisa fazer
- Publicar o site de novo. Nada muda no banco.
