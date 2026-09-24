# Alterações — 24/09/2026 · Asaas, modos de presente, "vou dar pessoalmente" e painel com login

## Resumo

| Pedido | O que foi feito |
|---|---|
| Pagamentos pelo Asaas (Pix e cartão) | Substituí o Mercado Pago (que era só simulação) por Asaas de verdade. Pix mostra QR Code na tela; cartão abre a página segura do Asaas. |
| Uma conta agora, fácil passar para 50/50 | O split é **só configuração**: definir `ASAAS_SPLIT_WALLET_ID` liga a divisão; deixar vazio = tudo numa conta. Nenhuma linha de código precisa mudar. |
| Evitar presente repetido (pedido da noiva) | Botão **"Vou dar pessoalmente"**: o convidado registra, o item sai da lista. Aviso bem visível na vitrine e no FAQ explicando que se não marcar, não tem como saber. |
| "Pessoalmente" só nos presentes menores | Cada presente tem a opção "Aceita vou dar pessoalmente" no painel. Presentes em cotas/valor livre nunca aceitam. |
| Cotas: dar 1k ou 1,5k em vez de 6k | Cada presente tem um **modo**, escolhido no painel: **Inteiro (sem cota)**, **Cotas fixas** (convidado escolhe quantas) ou **Valor livre** (convidado digita quanto, com mínimo). |
| Cupom para quem dá pessoalmente? | Liga/desliga no painel → aba **Configurações**. Padrão: desligado. |
| Painel de controle | Agora tem **login** (antes qualquer um entrava em `#/admin`). Abas novas: Contribuições, Sorteio real e Configurações. |

## Como funciona agora

### Para o convidado
1. Clica em **Presentear** → escolhe quantidade (ou valor, no modo livre) e **Pix / Cartão / Vou dar pessoalmente**.
2. Preenche nome, WhatsApp, CPF (só se for pagar — o Asaas exige) e mensagem opcional.
3. **Pix/cartão:** a cota fica **reservada por 30 min** (configurável) enquanto ele paga. A tela confirma sozinha quando o Asaas avisa.
4. **Pessoalmente:** confirma na hora, o item sai da lista.
5. Na confirmação: números da sorte + botão para mandar mensagem no WhatsApp do Igor. A mensagem também vai para o Mural de Recados.

### Para os noivos (painel `#/admin`)
- **Dashboard:** total arrecadado, cupons, pagamentos confirmados, quantos vão dar pessoalmente.
- **Presentes:** criar/editar com modo (inteiro/cotas/livre), aceitar pessoalmente, ocultar da vitrine.
- **Contribuições:** quem deu o quê, como e quando; link direto pro WhatsApp do convidado; **cancelar reserva** de quem desistiu (o item volta para a lista).
- **Sorteio:** lista de todos os números e botão **Sortear**.
- **Configurações:** cupom para quem dá pessoalmente, valor por cupom (R$ 50), tempo de reserva.

## Segurança (importante)
Antes, as regras do banco deixavam **qualquer visitante editar e apagar** presentes, pagamentos e cupons usando a chave pública. Agora:
- Visitante só **lê** a vitrine/recados e pode **escrever recado** no mural.
- Contribuições só são criadas/confirmadas pelas **Edge Functions** (servidor).
- A contagem de cotas é **calculada** a partir dos pagamentos — ninguém consegue "editar" o contador.
- A chave do Asaas **nunca vai para o navegador**.
- O webhook do Asaas é validado por token **e** o status é sempre reconsultado na API do Asaas.
- A vitrine pública mostra só totais — nunca nome/WhatsApp de quem deu.

## Arquivos

**Novos**
- `supabase/migrations/20260924120000_asaas_contribuicoes_e_admin.sql` — tabelas `contribuicoes`, `configuracoes`, `admins`; view `presentes_vitrine`; funções `reservar_contribuicao`, `confirmar_contribuicao`, `cancelar_contribuicao`; RLS novo.
- `supabase/functions/criar-contribuicao/` — cria reserva + cobrança no Asaas.
- `supabase/functions/status-contribuicao/` — polling da tela de pagamento (também consulta o Asaas, então funciona mesmo se o webhook atrasar).
- `supabase/functions/webhook-asaas/` — recebe confirmações/estornos do Asaas.
- `supabase/functions/_shared/` — cliente Asaas (**split fica em `asaas.ts` → `montarSplit()`**), acesso ao banco, sincronização.
- `src/lib/api.ts` — acesso a dados do site (com modo demonstração se o Supabase não estiver configurado).
- `src/lib/admin.ts` — operações do painel.
- `src/lib/utils/presentes.ts` — cálculo de disponibilidade por modo.
- `.env.example`

**Alterados**
- `src/components/CheckoutModal.tsx` — escolha de quantidade/valor e forma (Pix/cartão/pessoalmente), CPF, Pix real, polling.
- `src/components/GiftVitrine.tsx` — lê do banco, exibe por modo, selo "Pode dar pessoalmente", aviso da noiva.
- `src/components/AdminPanel.tsx` — login + novas abas.
- `src/components/MuralRecados.tsx` — lê/grava no banco.
- `src/App.tsx`, `src/types/index.ts`, `src/data/mockData.ts` (FAQ novo), `src/lib/utils/*`, `src/components/HeroSection.tsx` (um parágrafo).

**Removido**
- `src/lib/mercadopago/config.ts`

> O visual foi mantido — mesmas cores, fontes e componentes; só entraram os campos/textos novos.

## ⚠️ A migration apaga `transacoes` e `cupons_sorteio` antigas
Elas só tinham dados de exemplo (o Mercado Pago nunca foi ligado). Se por acaso já houver dado real no banco, **não rode a migration** antes de me avisar.

## Passo a passo para colocar no ar

1. **Banco**
   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   ```
2. **Criar o login dos noivos**: Supabase → Authentication → Users → *Add user* (e-mail + senha). Depois, no SQL Editor:
   ```sql
   insert into admins (user_id) select id from auth.users where email = 'email-dos-noivos@exemplo.com';
   ```
   E em Authentication → Providers → Email, **desligue "Allow new users to sign up"**.
3. **Secrets do Asaas** (use primeiro o sandbox para testar):
   ```bash
   supabase secrets set ASAAS_API_KEY=... ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3 ASAAS_WEBHOOK_TOKEN=um-token-longo-que-voce-inventa
   ```
   Produção: `ASAAS_BASE_URL=https://api.asaas.com/v3`.
4. **Deploy das funções**
   ```bash
   supabase functions deploy criar-contribuicao
   supabase functions deploy status-contribuicao
   supabase functions deploy webhook-asaas --no-verify-jwt
   ```
5. **Webhook no Asaas**: Integrações → Webhooks → nova URL
   `https://SEU_PROJECT_REF.supabase.co/functions/v1/webhook-asaas`, com o **mesmo token** do `ASAAS_WEBHOOK_TOKEN`, eventos de **Cobranças**.
6. **Front**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de hospedagem.

### Ligar o 50/50 (se os noivos criarem a segunda conta)
```bash
supabase secrets set ASAAS_SPLIT_WALLET_ID=walletId-da-segunda-conta ASAAS_SPLIT_PERCENTUAL=50
```
O `walletId` fica no Asaas da segunda conta (Integrações / Minha conta). A conta dona da `ASAAS_API_KEY` fica com o resto. O Asaas aplica o percentual sobre o valor **líquido** (depois das taxas). Para desligar, é só remover o secret (`supabase secrets unset ASAAS_SPLIT_WALLET_ID`).

## Testes feitos
- `npm run typecheck` e `npm run build` ✅
- Edge Functions checadas com `deno check` ✅
- As duas migrations rodadas num Postgres em memória, testando: limite de unidades, "pessoalmente" bloqueado em cotas, mínimo/máximo do valor livre, reserva expirada liberando cota, confirmação idempotente (não duplica cupom), cancelamento apagando cupons, visitante sem permissão de alterar nada ✅
- **Não testado ainda:** chamada real à API do Asaas (precisa da chave sandbox) — é o próximo passo.
- `npm run lint` limpo no `src/` (o único aviso é de uma cópia antiga em `.kilo/worktrees`).

## Data do evento centralizada
A data **não mudou** (10 de Abril de 2027, 18h00). Os textos que antes estavam escritos à mão em 7 lugares (Hero, Contagem, Local, Rodapé, FAQ, tela de confirmação e painel) agora saem de `EVENT_DATE` em `src/data/mockData.ts`. Para mudar a data, basta alterar essa linha. De quebra, sumiu o erro de lint antigo do `LocationSection.tsx` (o que ainda aparece é de uma cópia em `.kilo/worktrees`, fora do site).

## Como acessar o painel dos noivos
Endereço do site + `/#/admin` (ex.: `https://seusite.com.br/#/admin`; local: `http://localhost:5173/#/admin`). Entra com o e-mail/senha criados no Supabase (passo 2 abaixo). Não há link visível no site de propósito.

## Pendências / decisões
- [ ] Noivos decidirem se quem dá pessoalmente ganha número da sorte (já está no painel).
- [ ] Testar o fluxo completo no sandbox do Asaas.
- [ ] Parcelamento no cartão: hoje é à vista. Se quiserem parcelar, dá para liberar.
- [ ] Os textos do Hero/FAQ ainda falam "a cada R$ 50" fixo; se mudarem o valor no painel, lembrar de ajustar o texto.
- [ ]❯ quanto a api do asaas so falta configurar as chaves e o pagamento ja vai esta funcionando ?                                   

● O código tá todo pronto, mas ainda não rodou contra o Asaas de verdade, então não dá pra garantir que funciona de primeira.
  Além das chaves, falta isto:

  Precisa estar feito (tá no passo a passo do .md):  1. Supabase: linkar o projeto e rodar a migration (supabase db push).
  2. Deploy das 3 Edge Functions. O webhook-asaas vai com --no-verify-jwt.  3. Secrets do Asaas: ASAAS_API_KEY, ASAAS_BASE_URL e ASAAS_WEBHOOK_TOKEN.
  4. Cadastrar o webhook no painel do Asaas, apontando pra URL da função e usando o mesmo token.
  5. Variáveis do front: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na hospedagem.

  Do lado da conta Asaas dos noivos:
  - A conta precisa estar aprovada, com documentos enviados e análise concluída. Sem isso, a produção não recebe.
  - Precisa ter uma chave Pix cadastrada na conta Asaas. Sem ela, o Asaas não gera o QR Code do Pix.
  - Se forem usar o 50/50, a segunda conta também precisa estar aprovada, e a gente pega o walletId dela.

  O que ainda não foi testado: as regras do banco eu testei, mas as chamadas pro Asaas não. Isso inclui criar o cliente, gerar a  cobrança, pegar o QR Code, receber o webhook e confirmar. A lógica segue a documentação, mas algum detalhe pode precisar de
  ajuste, tipo formato de campo ou mensagem de erro.

  Minha recomendação: testar primeiro no sandbox, que é gratuito e não precisa de aprovação. Cria uma conta em
  sandbox.asaas.com, pega a chave e usa ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3. No sandbox dá pra simular o pagamento
  do Pix e do cartão pelo próprio painel do Asaas, aí a gente vê a cobrança nascer, o webhook chegar, a cota sumir da lista e os  cupons aparecerem. Passando no sandbox, pra ir pra produção é só trocar a chave e a URL.

  Quando tiver a chave do sandbox configurada, me chama que eu acompanho o teste com você e corrijo o que aparecer. Lembrando
  que você configura a chave pelo supabase secrets set, e eu não preciso ver ela.
