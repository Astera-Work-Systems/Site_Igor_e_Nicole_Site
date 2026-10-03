# Painel "perdia" o admin ao escolher foto (03/10/2026)

## Problema
Ao escolher uma foto para o presente (principalmente no celular), o painel às vezes trocava para
**"Sem permissão — este usuário não está cadastrado como administrador"** e o formulário sumia,
com a foto escolhida.

## Causa
Ao abrir a galeria, o navegador deixa o site em segundo plano. Na volta, o Supabase renova o login
sozinho, e cada renovação gera uma "sessão nova". O painel tratava isso como um login novo e
perguntava ao banco de novo "é admin?". Se essa pergunta falhasse por um instante (conexão
"acordando"), a falha era tratada como **"não é admin"**.

O cadastro como admin no banco **não foi alterado**: era só o painel interpretando errado uma
falha de conexão.

## O que mudou
- A verificação de admin só acontece quando **muda o usuário** (login/logout), e não a cada
  renovação automática do login. Editar e escolher fotos não derruba mais o painel.
- Uma falha de conexão **não vira mais "Sem permissão"**: o painel tenta 3 vezes e, se ainda
  falhar, mostra "Não foi possível confirmar seu acesso" com o botão **Tentar de novo**.
- "Sem permissão" agora só aparece quando o banco responde de fato que o usuário não é admin.

## Arquivos
- `src/components/AdminPanel.tsx`
- `src/lib/admin.ts`: `souAdmin()` passa a distinguir erro de "não é admin".

## O que você precisa fazer
- Publicar o site de novo e recarregar a página do painel.
- Se mesmo depois de recarregar continuar "Sem permissão", aí é o cadastro: no Supabase,
  em **Table Editor → admins**, confira se existe uma linha com o `user_id` do seu usuário
  (o id fica em **Authentication → Users**).
