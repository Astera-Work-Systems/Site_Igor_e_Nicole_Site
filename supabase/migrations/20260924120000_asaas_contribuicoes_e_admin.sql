/*
# Asaas, contribuições, modos de presente e painel com login

## O que muda
1. `presentes` ganha um `modo` escolhido pelos noivos no painel:
   - `inteiro` — presente sem cota. `valor` = preço de 1 unidade, `quantidade_total` = unidades desejadas.
                 Pode aceitar "vou dar pessoalmente" (`permite_pessoalmente`).
   - `cotas`   — `valor` = valor de cada cota, `quantidade_total` = número de cotas.
   - `livre`   — `valor` = meta total, o convidado escolhe quanto dar (>= `valor_minimo`).
   `quantidade_comprada` deixa de existir: o que já foi dado é CALCULADO a partir de `contribuicoes`
   (view `presentes_vitrine`), então ninguém consegue "editar" o contador pelo navegador.

2. `transacoes` é substituída por `contribuicoes` (pagamento pelo site OU reserva "pessoalmente").
   Um pagamento pendente segura a cota por `configuracoes.minutos_reserva` minutos.

3. `cupons_sorteio` passa a apontar para `contribuicoes` e a numeração é sequencial no banco.

4. `configuracoes` (linha única) — regras que os noivos mudam no painel.

5. `admins` — quem pode entrar no painel (Supabase Auth + esta tabela).

## Segurança
- Visitante (anon): só LÊ vitrine, recados e configurações, e pode ESCREVER recado no mural.
- Criar/confirmar/cancelar contribuições: só pelas Edge Functions (service_role) ou admin.
- Todo o resto: só admin.
*/

-- ==================== LIMPEZA DO MODELO ANTIGO ====================
-- As tabelas antigas só tinham dados de exemplo (Mercado Pago nunca foi integrado).
DROP TABLE IF EXISTS cupons_sorteio;
DROP TABLE IF EXISTS transacoes;

DROP POLICY IF EXISTS "anon_insert_presentes" ON presentes;
DROP POLICY IF EXISTS "anon_update_presentes" ON presentes;
DROP POLICY IF EXISTS "anon_delete_presentes" ON presentes;
DROP POLICY IF EXISTS "anon_select_presentes" ON presentes;
DROP POLICY IF EXISTS "anon_update_recados" ON recados;
DROP POLICY IF EXISTS "anon_delete_recados" ON recados;
DROP POLICY IF EXISTS "anon_insert_recados" ON recados;

-- ==================== ADMINS ====================
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

-- ==================== CONFIGURAÇÕES ====================
CREATE TABLE IF NOT EXISTS configuracoes (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cupom_pessoalmente boolean NOT NULL DEFAULT false,
  valor_por_cupom numeric(10, 2) NOT NULL DEFAULT 50 CHECK (valor_por_cupom > 0),
  minutos_reserva integer NOT NULL DEFAULT 30 CHECK (minutos_reserva BETWEEN 5 AND 1440),
  updated_at timestamptz DEFAULT now()
);
INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select_configuracoes" ON configuracoes FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "admin_update_configuracoes" ON configuracoes FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ==================== PRESENTES ====================
ALTER TABLE presentes
  ADD COLUMN IF NOT EXISTS modo text NOT NULL DEFAULT 'inteiro',
  ADD COLUMN IF NOT EXISTS valor_minimo numeric(10, 2),
  ADD COLUMN IF NOT EXISTS permite_pessoalmente boolean NOT NULL DEFAULT false;

ALTER TABLE presentes DROP COLUMN IF EXISTS quantidade_comprada;

ALTER TABLE presentes DROP CONSTRAINT IF EXISTS presentes_modo_check;
ALTER TABLE presentes ADD CONSTRAINT presentes_modo_check
  CHECK (modo IN ('inteiro', 'cotas', 'livre'));
ALTER TABLE presentes DROP CONSTRAINT IF EXISTS presentes_valores_check;
ALTER TABLE presentes ADD CONSTRAINT presentes_valores_check
  CHECK (valor > 0 AND quantidade_total >= 1 AND (valor_minimo IS NULL OR valor_minimo > 0));

-- Dados de exemplo antigos: "Cotas Grandes" viram cotas, o resto aceita "pessoalmente".
UPDATE presentes SET modo = 'cotas' WHERE categoria = 'Cotas Grandes';
UPDATE presentes SET permite_pessoalmente = true WHERE modo = 'inteiro';

CREATE POLICY "public_select_presentes" ON presentes FOR SELECT
  TO anon, authenticated USING (ativo OR is_admin());
CREATE POLICY "admin_insert_presentes" ON presentes FOR INSERT
  TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_presentes" ON presentes FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_presentes" ON presentes FOR DELETE
  TO authenticated USING (is_admin());

-- ==================== CONTRIBUIÇÕES ====================
CREATE TABLE IF NOT EXISTS contribuicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id uuid REFERENCES presentes(id) ON DELETE SET NULL,
  presente_titulo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('site', 'pessoalmente')),
  forma_pagamento text CHECK (forma_pagamento IN ('pix', 'cartao')),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade >= 1),
  valor numeric(10, 2) NOT NULL CHECK (valor > 0),
  nome_convidado text NOT NULL,
  whatsapp text NOT NULL,
  mensagem text,
  asaas_customer_id text,
  asaas_payment_id text UNIQUE,
  asaas_invoice_url text,
  expira_em timestamptz,
  confirmado_em timestamptz,
  cancelado_em timestamptz,
  created_at timestamptz DEFAULT now(),
  CHECK ((tipo = 'site') = (forma_pagamento IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_contribuicoes_presente ON contribuicoes(presente_id);
CREATE INDEX IF NOT EXISTS idx_contribuicoes_status ON contribuicoes(status);
CREATE INDEX IF NOT EXISTS idx_contribuicoes_created ON contribuicoes(created_at DESC);

ALTER TABLE contribuicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_contribuicoes" ON contribuicoes FOR SELECT
  TO authenticated USING (is_admin());

-- Uma contribuição "ocupa" o presente se está confirmada ou pendente dentro do prazo.
CREATE OR REPLACE FUNCTION contribuicao_ativa(c contribuicoes)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT c.status = 'confirmado' OR (c.status = 'pendente' AND c.expira_em > now());
$$;

-- ==================== CUPONS ====================
CREATE SEQUENCE IF NOT EXISTS cupons_numero_seq START 1;

CREATE TABLE IF NOT EXISTS cupons_sorteio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribuicao_id uuid NOT NULL REFERENCES contribuicoes(id) ON DELETE CASCADE,
  nome_convidado text NOT NULL,
  whatsapp text NOT NULL,
  numero_cupom integer NOT NULL UNIQUE DEFAULT nextval('cupons_numero_seq'),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cupons_contribuicao ON cupons_sorteio(contribuicao_id);

ALTER TABLE cupons_sorteio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_cupons" ON cupons_sorteio FOR SELECT
  TO authenticated USING (is_admin());

-- ==================== RECADOS ====================
CREATE POLICY "public_insert_recados" ON recados FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(nome_convidado) BETWEEN 3 AND 80
    AND char_length(mensagem) BETWEEN 5 AND 500
  );
CREATE POLICY "admin_delete_recados" ON recados FOR DELETE
  TO authenticated USING (is_admin());

-- ==================== VIEW DA VITRINE ====================
-- Expõe só totais agregados (nunca nome/WhatsApp de quem deu).
CREATE OR REPLACE VIEW presentes_vitrine AS
SELECT
  p.id, p.titulo, p.categoria, p.imagem_url, p.modo, p.valor, p.quantidade_total,
  p.valor_minimo, p.permite_pessoalmente, p.ativo, p.created_at,
  COALESCE(SUM(c.quantidade) FILTER (WHERE contribuicao_ativa(c)), 0)::integer AS quantidade_ocupada,
  COALESCE(SUM(c.valor) FILTER (WHERE contribuicao_ativa(c)), 0)::numeric(10, 2) AS valor_ocupado
FROM presentes p
LEFT JOIN contribuicoes c ON c.presente_id = p.id
WHERE p.ativo OR is_admin()
GROUP BY p.id;

GRANT SELECT ON presentes_vitrine TO anon, authenticated;

-- ==================== FUNÇÕES DE NEGÓCIO ====================

-- Reserva (atomicamente) uma contribuição. Chamada só pela Edge Function `criar-contribuicao`.
CREATE OR REPLACE FUNCTION reservar_contribuicao(
  p_presente_id uuid,
  p_tipo text,
  p_forma_pagamento text,
  p_quantidade integer,
  p_valor numeric,
  p_nome text,
  p_whatsapp text,
  p_mensagem text
)
RETURNS contribuicoes
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_presente presentes;
  v_config configuracoes;
  v_qtd_ocupada integer;
  v_valor_ocupado numeric;
  v_restante_qtd integer;
  v_restante_valor numeric;
  v_minimo numeric;
  v_quantidade integer;
  v_valor numeric;
  v_nova contribuicoes;
BEGIN
  -- Trava o presente: duas pessoas não conseguem pegar a última cota ao mesmo tempo.
  SELECT * INTO v_presente FROM presentes WHERE id = p_presente_id FOR UPDATE;
  IF NOT FOUND OR NOT v_presente.ativo THEN
    RAISE EXCEPTION 'Este presente não está mais disponível.';
  END IF;

  SELECT * INTO v_config FROM configuracoes WHERE id = 1;

  SELECT COALESCE(SUM(c.quantidade), 0), COALESCE(SUM(c.valor), 0)
    INTO v_qtd_ocupada, v_valor_ocupado
  FROM contribuicoes c
  WHERE c.presente_id = p_presente_id AND contribuicao_ativa(c);

  IF p_tipo = 'pessoalmente' AND NOT (v_presente.modo = 'inteiro' AND v_presente.permite_pessoalmente) THEN
    RAISE EXCEPTION 'Este presente só pode ser dado pelo site.';
  END IF;
  IF p_tipo NOT IN ('site', 'pessoalmente') THEN
    RAISE EXCEPTION 'Tipo de contribuição inválido.';
  END IF;

  IF v_presente.modo = 'livre' THEN
    v_restante_valor := v_presente.valor - v_valor_ocupado;
    v_minimo := LEAST(COALESCE(v_presente.valor_minimo, 1), v_restante_valor);
    v_valor := ROUND(COALESCE(p_valor, 0), 2);
    v_quantidade := 1;
    IF v_restante_valor <= 0 THEN
      RAISE EXCEPTION 'Este presente já foi completado. Obrigado!';
    END IF;
    IF v_valor < v_minimo OR v_valor > v_restante_valor THEN
      RAISE EXCEPTION 'Escolha um valor entre R$ % e R$ %.',
        replace(to_char(v_minimo, 'FM9999990.00'), '.', ','),
        replace(to_char(v_restante_valor, 'FM9999990.00'), '.', ',');
    END IF;
  ELSE
    v_restante_qtd := v_presente.quantidade_total - v_qtd_ocupada;
    v_quantidade := COALESCE(p_quantidade, 1);
    IF v_restante_qtd <= 0 THEN
      RAISE EXCEPTION 'Este presente já foi garantido por outro convidado. Obrigado!';
    END IF;
    IF v_quantidade < 1 OR v_quantidade > v_restante_qtd THEN
      RAISE EXCEPTION 'Restam apenas % disponíveis.', v_restante_qtd;
    END IF;
    v_valor := v_presente.valor * v_quantidade;
  END IF;

  INSERT INTO contribuicoes (
    presente_id, presente_titulo, tipo, forma_pagamento, status, quantidade, valor,
    nome_convidado, whatsapp, mensagem, expira_em
  ) VALUES (
    v_presente.id, v_presente.titulo, p_tipo,
    CASE WHEN p_tipo = 'site' THEN p_forma_pagamento END,
    'pendente', v_quantidade, v_valor,
    p_nome, p_whatsapp, NULLIF(TRIM(p_mensagem), ''),
    now() + make_interval(mins => v_config.minutos_reserva)
  )
  RETURNING * INTO v_nova;

  RETURN v_nova;
END;
$$;

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
    v_qtd_cupons := FLOOR(v_c.valor / v_config.valor_por_cupom);
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

-- Cancela: libera a cota e apaga os cupons. Usada pelo webhook (estorno/vencida) e pelo painel.
CREATE OR REPLACE FUNCTION cancelar_contribuicao(p_id uuid)
RETURNS contribuicoes
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c contribuicoes;
BEGIN
  IF NOT (is_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Sem permissão.';
  END IF;

  UPDATE contribuicoes
    SET status = 'cancelado', cancelado_em = now()
    WHERE id = p_id
    RETURNING * INTO v_c;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribuição não encontrada.';
  END IF;

  DELETE FROM cupons_sorteio WHERE contribuicao_id = p_id;
  RETURN v_c;
END;
$$;

REVOKE ALL ON FUNCTION reservar_contribuicao(uuid, text, text, integer, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION confirmar_contribuicao(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION cancelar_contribuicao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION reservar_contribuicao(uuid, text, text, integer, numeric, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION confirmar_contribuicao(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION cancelar_contribuicao(uuid) TO service_role, authenticated;
