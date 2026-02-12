-- ======================================================================
-- Migration: RPC em batch para sort_order (atomicidade)
-- - update_product_image_links_sort_order: atualiza N links em 1 request
-- - update_product_variants_sort_order: atualiza N variações em 1 request
-- Payload: [{"id":"uuid","sort_order":0}, ...]
-- ======================================================================

-- 1) product_image_links: batch update sort_order (1 UPDATE, transação implícita)
CREATE OR REPLACE FUNCTION public.update_product_image_links_sort_order(p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_payload IS NULL OR jsonb_array_length(p_payload) = 0 THEN
    RETURN;
  END IF;

  UPDATE public.product_image_links pil
  SET sort_order = v.sort_order
  FROM (
    SELECT (elem->>'id')::uuid AS id, COALESCE((elem->>'sort_order')::int, 0) AS sort_order
    FROM jsonb_array_elements(p_payload) AS elem
  ) v
  WHERE pil.id = v.id AND pil.user_id = auth.uid();
END;
$$;

-- 2) product_variants: batch update sort_order (1 UPDATE, transação implícita)
-- Requer products.user_id = auth.uid() para o produto
CREATE OR REPLACE FUNCTION public.update_product_variants_sort_order(p_product_id uuid, p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_product_id IS NULL OR p_payload IS NULL OR jsonb_array_length(p_payload) = 0 THEN
    RETURN;
  END IF;

  UPDATE public.product_variants pv
  SET sort_order = v.sort_order
  FROM (
    SELECT (elem->>'id')::uuid AS id, COALESCE((elem->>'sort_order')::int, 0) AS sort_order
    FROM jsonb_array_elements(p_payload) AS elem
  ) v
  WHERE pv.id = v.id
    AND pv.product_id = p_product_id
    AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = p_product_id AND p.user_id = auth.uid());
END;
$$;

-- Grant execute para authenticated
GRANT EXECUTE ON FUNCTION public.update_product_image_links_sort_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_variants_sort_order(uuid, jsonb) TO authenticated;
