# Avisos do npm na instalação — 31/10/2026

## 1. `esbuild` com script de instalação não aprovado

**Aviso:**
```
npm warn install-scripts esbuild@0.25.12 (postinstall: node install.js)
```

**Causa:** o npm 11 passou a bloquear scripts de instalação de pacotes até que
sejam aprovados. O `esbuild` (usado pelo Vite para gerar o site) precisa desse
script para verificar o binário dele.

**Correção:** rodado `npm install-scripts approve esbuild`, que adicionou ao
`package.json`:

```json
"allowScripts": {
  "esbuild@0.25.12": true
}
```

A aprovação vale **só para a versão 0.25.12**. Se o esbuild for atualizado, o
npm vai avisar de novo e a nova versão precisa ser revisada e aprovada — de
propósito, por segurança.

**Testado:** `npm install-scripts ls` → "No packages with unreviewed install
scripts"; `npm ci` e `npm run build` funcionando.

## 2. `Unknown env config "cache-dir"`

**Causa:** não vem do projeto. Não existe `cache-dir` no `.npmrc` do projeto,
no do usuário, no global, nem nas variáveis de ambiente desta máquina. Vem de
uma variável `npm_config_cache_dir` definida pelo ambiente onde o comando rodou
(normalmente a plataforma de build, como a Vercel).

**Correção:** nenhuma necessária no projeto. É só um aviso, a instalação
funciona normalmente. Se aparecer no computador local, procurar e remover a
variável `NPM_CONFIG_CACHE_DIR` (ou trocar por `NPM_CONFIG_CACHE`).

## Pendente (não alterado)

O `npm audit` aponta uma vulnerabilidade moderada no `minimatch`, usado apenas
pelo ESLint (ferramenta de desenvolvimento — não vai para o site publicado). A
correção automática (`npm audit fix --force`) faria downgrade do
`typescript-eslint`, então não foi aplicada.
