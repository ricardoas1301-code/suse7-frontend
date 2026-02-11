# Módulo de Imagens (Suse7)

## Estrutura

- **imageStorageService.js** — Upload, signed URL, delete no Supabase Storage
- **imageRepository.js** — CRUD de `image_assets` e `product_image_links`
- **imageRules.js** — Regras puras: `ensureSinglePrimary`, `normalizeSortOrder`, `getFallbackPrimary`
- **schema.sql** — Script para criar tabelas e bucket no Supabase

## Pré-requisitos

1. Criar bucket `product-images` no Supabase Storage
2. Executar `schema.sql` no SQL Editor
3. Configurar RLS/políticas conforme sua regra de negócio

## Uso

O componente `ProductFormImagesTab` consome estes serviços e gerencia a UI.
