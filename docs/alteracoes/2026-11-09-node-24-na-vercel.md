# Node 24.x fixado no projeto — 09/11/2026

## O que mudou

O campo `engines.node` passou de `>=22.12.0` para `24.x` em dois arquivos:

- `package.json`
- `package-lock.json`

## Por quê

O intervalo aberto `>=22.12.0` permite que a Vercel use a versão mais nova do
Node disponível (hoje, a 26), mesmo com outra versão escolhida no painel. O
projeto é desenvolvido no Node 24 e não foi testado no 26.

Com `24.x`, o build fica na linha 24 e só muda de versão principal quando
alguém alterar esse campo.

## O que não muda

O site é estático (Vite) e não usa funções da Vercel. O Node só é usado durante
o build, e o backend continua nas funções do Supabase. As opções Fluid Compute
e Function CPU do painel não afetam este projeto.

## Testado

No Node 24.22.1:

- `npm ci`: instalação concluída.
- `npm run build`: build concluído, sem erros.

Ainda falta confirmar no log do próximo deploy da Vercel que o build usou o
Node 24.

## Pendente (não alterado)

O `npm audit` aponta 8 vulnerabilidades moderadas, todas em ferramentas de
desenvolvimento e build: `vite`, `minimatch` e os pacotes do `typescript-eslint`.
O `npm audit --omit=dev` retorna 0 vulnerabilidades, ou seja, nenhuma está nas
dependências que vão para o site publicado. A correção automática
(`npm audit fix --force`) pode trazer mudanças incompatíveis e não foi aplicada.
