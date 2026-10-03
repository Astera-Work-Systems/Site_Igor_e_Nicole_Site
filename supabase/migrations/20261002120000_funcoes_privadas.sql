/*
# Funções SECURITY DEFINER fora da API

O Security Advisor do Supabase acusa `public.is_admin()` e `public.cancelar_contribuicao()`
por serem SECURITY DEFINER (rodam com permissão de dono) e chamáveis pela API.
Elas já se protegiam sozinhas (is_admin só responde sobre quem chama; cancelar exige admin),
mas o padrão recomendado é deixar o código privilegiado num schema que a API não expõe.

## O que muda
- O código privilegiado vai para `private.is_admin()` e `private.cancelar_contribuicao()`.
- As versões em `public` viram SECURITY INVOKER (rodam com a permissão de quem chama)
  e só repassam para as privadas. Mesmo nome, mesmos parâmetros, mesmo retorno:
  as policies de RLS, o painel admin (`rpc('is_admin')`, `rpc('cancelar_contribuicao')`)
  e as Edge Functions continuam funcionando sem mudar nada.
*/

GRANT USAGE ON SCHEMA private TO service_role;

-- ==================== is_admin ====================
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
-- anon precisa: a vitrine (presentes_vitrine) e as policies chamam is_admin() para visitantes também.
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.is_admin();
$$;

-- ==================== cancelar_contribuicao ====================
CREATE OR REPLACE FUNCTION private.cancelar_contribuicao(p_id uuid)
RETURNS contribuicoes
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c contribuicoes;
BEGIN
  IF NOT (private.is_admin() OR auth.role() = 'service_role') THEN
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

REVOKE ALL ON FUNCTION private.cancelar_contribuicao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.cancelar_contribuicao(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancelar_contribuicao(p_id uuid)
RETURNS public.contribuicoes
LANGUAGE sql SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT * FROM private.cancelar_contribuicao(p_id);
$$;

REVOKE ALL ON FUNCTION public.cancelar_contribuicao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_contribuicao(uuid) TO authenticated, service_role;
