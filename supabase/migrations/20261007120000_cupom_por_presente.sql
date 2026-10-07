/*
# Números da sorte: 1 por presente + 1 a cada R$ 50

Pedido da noiva (07/10/2026): presentes abaixo de R$ 50 não geravam número nenhum.
Nova regra, por unidade de presente:
  números = quantidade × (1 + FLOOR(valor_unitário / valor_por_cupom))
Ex. (R$ 50 por cupom): R$ 30 → 1 · R$ 50 → 2 · R$ 99 → 2 · R$ 100 → 3 · 2 × R$ 30 → 2.

Também completa os números das contribuições já confirmadas que ganhariam mais pela regra nova
(nenhum número existente é apagado ou renumerado).
*/

CREATE OR REPLACE FUNCTION cupons_por_regra(p_valor numeric, p_quantidade integer, p_valor_por_cupom numeric)
RETURNS integer
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT (GREATEST(p_quantidade, 1)
    * (1 + FLOOR((p_valor / GREATEST(p_quantidade, 1)) / p_valor_por_cupom)))::integer;
$$;

REVOKE ALL ON FUNCTION cupons_por_regra(numeric, integer, numeric) FROM PUBLIC, anon, authenticated;

-- Confirma (idempotente): gera cupons e publica o recado no mural.
CREATE OR REPLACE FUNCTION confirmar_contribuicao(p_id uuid)
RETURNS contribuicoes
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c contribuicoes;
  v_config configuracoes;
  v_qtd_cupons integer;
BEGIN
  SELECT * INTO v_c FROM contribuicoes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribuição não encontrada.';
  END IF;
  IF v_c.status = 'confirmado' THEN
    RETURN v_c;
  END IF;

  -- Mesmo se a reserva tinha expirado/sido cancelada: se o dinheiro caiu, vale.
  UPDATE contribuicoes
    SET status = 'confirmado', confirmado_em = now(), cancelado_em = NULL
    WHERE id = p_id
    RETURNING * INTO v_c;

  SELECT * INTO v_config FROM configuracoes WHERE id = 1;

  IF v_c.tipo = 'site' OR v_config.cupom_pessoalmente THEN
    v_qtd_cupons := cupons_por_regra(v_c.valor, v_c.quantidade, v_config.valor_por_cupom);
    INSERT INTO cupons_sorteio (contribuicao_id, nome_convidado, whatsapp)
    SELECT v_c.id, v_c.nome_convidado, v_c.whatsapp
    FROM generate_series(1, v_qtd_cupons);
  END IF;

  IF v_c.mensagem IS NOT NULL THEN
    INSERT INTO recados (nome_convidado, mensagem, presente_titulo)
    VALUES (v_c.nome_convidado, v_c.mensagem, v_c.presente_titulo);
  END IF;

  RETURN v_c;
END;
$$;

REVOKE ALL ON FUNCTION confirmar_contribuicao(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION confirmar_contribuicao(uuid) TO service_role;

-- Completa os números de quem já presenteou (em ordem de confirmação).
INSERT INTO cupons_sorteio (contribuicao_id, nome_convidado, whatsapp)
SELECT c.id, c.nome_convidado, c.whatsapp
FROM contribuicoes c
CROSS JOIN configuracoes cfg
CROSS JOIN LATERAL (
  SELECT cupons_por_regra(c.valor, c.quantidade, cfg.valor_por_cupom)
    - (SELECT COUNT(*) FROM cupons_sorteio s WHERE s.contribuicao_id = c.id)::integer AS faltam
) f
CROSS JOIN LATERAL generate_series(1, f.faltam)
WHERE cfg.id = 1
  AND c.status = 'confirmado'
  AND (c.tipo = 'site' OR cfg.cupom_pessoalmente)
  AND f.faltam > 0
ORDER BY c.confirmado_em, c.id;
