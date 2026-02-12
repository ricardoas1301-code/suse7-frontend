# Módulo de Imagens (Suse7)

## Estrutura

- **imageStorageService.js** — Upload, signed URL, delete no Supabase Storage
- **imageRepository.js** — CRUD de `product_image_links` (tabela única com metadata inline)
- **imageRules.js** — Regras puras: `ensureSinglePrimary`, `normalizeSortOrder`, `getFallbackPrimary`
- **schema.sql** — Referência do schema (usar migration 20260212000000)

## Pré-requisitos

1. Criar bucket `product-images` no Supabase Storage
2. Executar migration `supabase/migrations/20260212000000_create_product_image_links.sql`
3. Tabela `public.products` deve existir (product_id FK)

## Uso

O componente `ProductFormImagesTab` consome estes serviços e gerencia a UI.
