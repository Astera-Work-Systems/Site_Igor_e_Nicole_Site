/*
# Vitrine sem SECURITY DEFINER

O Security Advisor do Supabase acusa `presentes_vitrine` por ser uma view SECURITY DEFINER
(ela ignora o RLS de quem consulta). Ela precisava disso só para somar as `contribuicoes`,
que o visitante não pode ler.

## O que muda
- A soma vai para `private.ocupacao_presentes()`, que devolve SÓ totais por presente
  (nunca nome/WhatsApp). O schema `private` não é exposto pela API do Supabase.
- A view passa a ser `security_invoker`: a parte de `presentes` respeita o RLS de quem consulta
  (visitante vê só os ativos; admin vê todos), igual ao `WHERE` de antes.
- Colunas e resultado da view continuam idênticos — nada muda no site.
*/

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.ocupacao_presentes()
RETURNS TABLE (presente_id uuid, quantidade_ocupada integer, valor_ocupado numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.presente_id, SUM(c.quantidade)::integer, SUM(c.valor)::numeric(10, 2)
  FROM contribuicoes c
  WHERE c.presente_id IS NOT NULL AND contribuicao_ativa(c)
  GROUP BY c.presente_id;
$$;

REVOKE ALL ON FUNCTION private.ocupacao_presentes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.ocupacao_presentes() TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW presentes_vitrine
WITH (security_invoker = true) AS
SELECT
  p.id, p.titulo, p.categoria, p.imagem_url, p.modo, p.valor, p.quantidade_total,
  p.valor_minimo, p.permite_pessoalmente, p.ativo, p.created_at,
  COALESCE(o.quantidade_ocupada, 0)::integer AS quantidade_ocupada,
  COALESCE(o.valor_ocupado, 0)::numeric(10, 2) AS valor_ocupado
FROM presentes p
LEFT JOIN private.ocupacao_presentes() o ON o.presente_id = p.id
WHERE p.ativo OR is_admin();

GRANT SELECT ON presentes_vitrine TO anon, authenticated;

-- Outro aviso do Advisor ("Function Search Path Mutable"): a única função sem search_path fixo.
ALTER FUNCTION contribuicao_ativa(contribuicoes) SET search_path = public;
