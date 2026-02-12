# Checklist de Testes — Fase Imagens (Draft + Relink)

## Pré-requisitos

- [ ] Migration `20260212000000_create_product_image_links.sql` executada
- [ ] Bucket `product-images` criado no Supabase Storage
- [ ] Tabela `public.products` existe (product_id FK)

---

## 1. Draft → Upload → Set Primary → Reorder → Salvar

### Fluxo completo

1. [ ] Abrir ProductCreate (novo produto)
2. [ ] Ir para aba Imagens (sem salvar produto)
3. [ ] Fazer upload de 2–3 imagens
4. [ ] Definir uma como principal
5. [ ] Reordenar por drag & drop
6. [ ] Preencher Dados, Custos, Estoque obrigatórios
7. [ ] Clicar Salvar produto
8. [ ] **Nada some**: imagens permanecem vinculadas
9. [ ] **sort_order preserva**: ordem mantida após relink
10. [ ] **primary preserva**: imagem principal continua marcada

---

## 2. RLS — Isolamento entre usuários

1. [ ] Usuário A: criar draft com imagens
2. [ ] Usuário B: logar em outra conta
3. [ ] Usuário B: tentar acessar/alterar imagens do usuário A
4. [ ] **Resultado esperado**: usuário B não vê nem altera imagens do A

---

## 3. Primary por escopo

1. [ ] Produto com 2 imagens: definir uma como primary
2. [ ] Tentar definir a segunda como primary
3. [ ] **Resultado esperado**: apenas uma primary por escopo (global ou por variant_key)
4. [ ] UNIQUE parcial no DB deve impedir 2 primary no mesmo escopo

---

## 4. Reorder — Sem duplicar sort_order

1. [ ] Upload de 3 imagens
2. [ ] Reordenar por drag & drop
3. [ ] Verificar que `sort_order` é sequencial (0, 1, 2)
4. [ ] Recarregar página: ordem preservada

---

## 5. Conflito de primary no relink

1. [ ] Produto existente com 1 imagem (primary)
2. [ ] Em outro fluxo: draft com 2 imagens, uma primary
3. [ ] Relink (salvar produto draft → produto existente)
4. [ ] **Regra**: primary do draft tem prioridade; antiga primary do produto é desmarcada

---

## 6. Produto com variações

1. [ ] Produto com variações (ex: Cor, Tamanho)
2. [ ] Selecionar variação no dropdown
3. [ ] Upload de imagens por variação
4. [ ] Definir primary por variação
5. [ ] Salvar: relink correto por variant_key

---

## Edge cases e riscos

| Cenário | Risco | Mitigação |
|--------|-------|-----------|
| product_id BIGINT em DB antigo | Relink falha (tipo incompatível) | Migration 20250210000001 ou alter manual |
| products.user_id ausente | Validação de ownership falha | Garantir coluna e RLS em products |
| Draft sem imagens | relinkDraftToProduct sai early | OK, sem efeito colateral |
| Produto de outro usuário | Relink bloqueado | Validação products.user_id = auth.uid() |

---

## Arquivos alterados (resumo)

- `src/services/images/imageRepository.js` — tabela única, createImageRecord, relink seguro
- `src/components/ProductFormImagesTab.jsx` — createImageRecord, link.storage_path
- `src/services/images/schema.sql` — schema de referência
- `supabase/migrations/20260212000000_create_product_image_links.sql` — criação da tabela
