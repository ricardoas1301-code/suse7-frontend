-- ======================================================================
-- Storage: bucket product-images — políticas para upload/download
-- Execute este script APÓS criar o bucket "product-images" no Supabase Dashboard
-- Path esperado: userId/draftKey/filename ou userId/productId/filename
--
-- LEITURA PÚBLICA (listagem / getPublicUrl) — recomendado para Suse7:
-- - No Dashboard: Storage > product-images > marcar bucket como público (Public bucket),
--   OU manter privado e usar apenas URLs assinadas (não é o fluxo atual do app).
-- - Com bucket público: qualquer um com a URL completa do objeto pode GET (paths incluem
--   userId UUID + segmentos opacos; não há listagem anônima do bucket).
-- - Escrita continua restrita às políticas INSERT/UPDATE/DELETE abaixo (path sob auth.uid()).
-- ======================================================================

-- Políticas em storage.objects (bucket product-images)
-- Nota: O path é userId/draftKey/filename ou userId/productId/filename

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

-- DELETE: usuário autenticado pode remover do seu próprio path
CREATE POLICY "product_images_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
