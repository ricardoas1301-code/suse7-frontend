-- ======================================================================
-- SUSE7 — Setup do bucket de imagens (product-images)
-- Arquivo: supabase/storage_product_images_setup.sql
--
-- Objetivo:
--   1) Garantir que o bucket "product-images" exista.
--   2) Configurar políticas de RLS em storage.objects para:
--        - Restringir ao bucket "product-images".
--        - Permitir acesso apenas aos arquivos do próprio usuário
--          (caminho iniciando com auth.uid()).
--
-- IMPORTANTE:
--   - Execute este script no projeto Supabase de DEV e de PROD.
--   - Execute em um projeto por vez (SQL editor do dashboard).
--   - Caso já exista alguma policy de storage para este bucket,
--     revise antes de rodar em PROD.
-- ======================================================================

-- ----------------------------------------------------------------------
-- 1) Criar bucket "product-images" se ainda não existir
-- ----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-images', 'product-images', FALSE);
  END IF;
END $$;

-- Opcional (boa prática): garantir que RLS esteja habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------
-- 2) Políticas de acesso (RLS) para o bucket product-images
--
-- Convenção de path usada pelo frontend (imageStorageService.js):
--   name = '<userId>/<productId_ou_draftKey>/<filename>'
--   Ex:  'e2b...-uid/prod-uuid/1709253529_abcd.jpg'
--
-- As políticas abaixo:
--   - Limitam o bucket_id a 'product-images'
--   - Exigem que o primeiro segmento do path (folder raiz)
--     seja igual ao auth.uid() do usuário autenticado.
--
-- Notas:
--   - storage.foldername(name) retorna array de pastas do path.
--   - (storage.foldername(name))[1] é o primeiro segmento antes da primeira '/'.
-- ----------------------------------------------------------------------

-- Limpar policies antigas com os mesmos nomes (idempotente)
DROP POLICY IF EXISTS "product_images_select_own" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_own" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_own" ON storage.objects;

-- SELECT: usuário autenticado pode ler arquivos no seu próprio path
CREATE POLICY "product_images_select_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT: usuário autenticado pode enviar para seu próprio path
CREATE POLICY "product_images_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: usuário autenticado pode atualizar seu próprio path
CREATE POLICY "product_images_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: usuário autenticado pode remover arquivos do seu próprio path
CREATE POLICY "product_images_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

