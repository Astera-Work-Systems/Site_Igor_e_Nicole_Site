# Menu do celular sobrepondo o conteúdo

**Data:** 22/10/2026

## Problema

No celular, ao tocar no botão de menu (canto superior direito) com a página no topo, a lista de links
(O Evento, Presentes, Sorteio…) aparecia **sem fundo**, desenhada por cima do texto e da foto do hero.
Parecia que a imagem/página tinha "bugado".

Causa: o cabeçalho só ganha fundo depois que a página é rolada (`scrolled`). No topo ele é transparente,
e o menu aberto herdava essa transparência.

## Correção

- `src/components/Header.tsx`: quando o menu está aberto, o cabeçalho usa fundo sólido (`bg-canvas`)
  com sombra, independente da rolagem. Fechado, continua como antes (transparente no topo, translúcido
  com desfoque depois de rolar).
- Troquei `duration-400` (classe que não existe no Tailwind, era ignorada) por `duration-300`.

## Como foi testado

- Chrome headless em tela de celular (390×844): menu fechado, abrindo (60/150/400 ms), aberto no topo
  e aberto com a página rolada sobre a foto. Em todos o menu aparece limpo, sem conteúdo vazando.
- `tsc`, `eslint` e `vite build` passando.
