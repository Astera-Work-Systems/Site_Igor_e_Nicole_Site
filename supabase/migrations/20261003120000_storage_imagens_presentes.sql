/*
# Imagens dos presentes no Supabase Storage

O painel agora envia a foto direto (compactada no navegador para WebP, ~30–100 KB)
em vez de depender de links de outros sites, que muitas vezes bloqueiam o uso.

## O que cria
- Bucket `presentes`, público para leitura (a vitrine mostra a imagem pela URL pública).
  Limite de 1 MB por arquivo e só formatos de imagem, como segunda barreira caso
  alguém tente enviar sem passar pela compactação.
- Policies em storage.objects: só admins (public.is_admin()) enviam, trocam e apagam.
  O SELECT também é só de admin (o remove() da API exige): o bucket público já serve
  os arquivos pela URL para os visitantes, mas eles não conseguem listar o conteúdo.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('presentes', 'presentes', true, 1048576, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins veem imagens de presentes" ON storage.objects;
CREATE POLICY "Admins veem imagens de presentes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'presentes' AND public.is_admin());

DROP POLICY IF EXISTS "Admins enviam imagens de presentes" ON storage.objects;
CREATE POLICY "Admins enviam imagens de presentes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'presentes' AND public.is_admin());

DROP POLICY IF EXISTS "Admins alteram imagens de presentes" ON storage.objects;
CREATE POLICY "Admins alteram imagens de presentes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'presentes' AND public.is_admin())
  WITH CHECK (bucket_id = 'presentes' AND public.is_admin());

DROP POLICY IF EXISTS "Admins apagam imagens de presentes" ON storage.objects;
CREATE POLICY "Admins apagam imagens de presentes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'presentes' AND public.is_admin());
