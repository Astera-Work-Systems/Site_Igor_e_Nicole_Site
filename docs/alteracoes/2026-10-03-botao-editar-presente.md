# Botão de editar presente "não funcionava" (03/10/2026)

## Problema
Ao clicar no lápis (editar) de um presente, parecia que nada acontecia.
O formulário de edição abria no **topo da lista**, fora da tela, quando o presente clicado
estava mais abaixo. Com mais presentes cadastrados (cadastro em lote), isso passou a acontecer
quase sempre.

## O que mudou
- A edição agora abre **logo abaixo do presente clicado**.
- A tela rola automaticamente até o formulário (vale também para "Novo presente").

## Arquivos
- `src/components/AdminPanel.tsx`

## O que você precisa fazer
- Publicar o site de novo. Nada muda no banco.
