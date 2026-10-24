/*
# Limite de requisições por IP + recados só pela Edge Function

## limites_requisicao
Contador por (rota + hash do IP) numa janela de tempo, usado pelas Edge Functions
(`limitar()` em `_shared/http.ts`). Fica no banco porque as Edge Functions rodam em várias
instâncias ao mesmo tempo; um contador em memória não valeria entre elas.
- Guarda só o hash SHA-256 do IP, nunca o IP (LGPD).
- RLS ligado e nenhuma policy: anon/authenticated não leem nem escrevem.
- `consumir_limite` só pode ser chamada pela service_role (Edge Functions).

## recados
O INSERT anônimo direto na tabela sai: o mural agora envia pela Edge Function `enviar-recado`,
que tem limite por IP. A leitura pública do mural continua igual.
*/

CREATE TABLE IF NOT EXISTS limites_requisicao (
  chave text PRIMARY KEY,
  janela_inicio timestamptz NOT NULL DEFAULT now(),
  contagem integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_limites_janela ON limites_requisicao(janela_inicio);

ALTER TABLE limites_requisicao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE limites_requisicao FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE limites_requisicao TO service_role;

-- Conta mais uma requisição e diz se ela está dentro do limite. Atômica (um único UPSERT).
CREATE OR REPLACE FUNCTION consumir_limite(p_chave text, p_max integer, p_janela_segundos integer)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_contagem integer;
BEGIN
  INSERT INTO limites_requisicao AS l (chave, janela_inicio, contagem)
  VALUES (p_chave, now(), 1)
  ON CONFLICT (chave) DO UPDATE
    SET contagem = CASE
          WHEN l.janela_inicio < now() - make_interval(secs => p_janela_segundos) THEN 1
          ELSE l.contagem + 1
        END,
        janela_inicio = CASE
          WHEN l.janela_inicio < now() - make_interval(secs => p_janela_segundos) THEN now()
          ELSE l.janela_inicio
        END
  RETURNING contagem INTO v_contagem;

  -- Faxina de vez em quando (~1 a cada 100 chamadas): apaga contadores de mais de 1 dia.
  IF random() < 0.01 THEN
    DELETE FROM limites_requisicao WHERE janela_inicio < now() - interval '1 day';
  END IF;

  RETURN v_contagem <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION consumir_limite(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consumir_limite(text, integer, integer) TO service_role;

-- ==================== RECADOS ====================
DROP POLICY IF EXISTS "public_insert_recados" ON recados;
DROP POLICY IF EXISTS "anon_insert_recados" ON recados;
REVOKE INSERT, UPDATE, DELETE ON TABLE recados FROM anon;
-- O admin continua apagando recados pela policy "admin_delete_recados" (authenticated + is_admin()).
