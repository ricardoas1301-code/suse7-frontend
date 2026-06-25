# Precificação Inteligente — Auditoria S1.8

Rota: `/precificacoes/inteligente/:listingId`  
Container: `PricingIntelligencePage.jsx`  
Conteúdo: `PricingIntelligenceContent.jsx` (`variant="page"`)

## ✅ Resolver oficial de frete/comissão simulado (backend) — IMPLEMENTADO (fase backend)

Recalcula **comissão/tarifa, frete por preço, repasse, lucro e margem** para um preço (ou margem) **simulado**, por **tipo de anúncio** (Clássico/Premium), reaproveitando 100% a engine oficial (Anúncios / Raio-X). Sem regra financeira paralela e sem hardcode.

**Endpoint:** `POST /api/ml/listings/pricing-simulate-scenario`

Payload:

```jsonc
{
  "listingId": "<uuid>",          // ou "listingExternalId": "MLB6086959274"
  "listingType": "premium",        // "classic" | "premium"
  "salePrice": "299.90",           // edita por preço, OU
  "targetMarginPct": "20"          // edita por margem (solver iterativo oficial)
}
```

Resposta (resumo): `{ ok, listing_type, listing_type_id, edited_from, commission_source, official_fee_percent, resolved_sale_price_brl, resolved_margin_pct, scenario }` — `scenario` é o objeto completo no mesmo contrato de `pricing-scenarios` (`marketplace`, `result`, `internal_costs`, `data_quality`, etc.).

**Fontes oficiais reaproveitadas (zero regra nova):**

- Comissão por tipo/preço/categoria: `enrichItemWithListingPricesFees` → `GET /sites/MLB/listing_prices` (token da conta). → `domain/pricing/mercadoLivreSimulateListingTypeScenario.js`.
- Frete por preço: `resolveMercadoLivreScenarioShippingAsync` → `GET /items/:id/shipping_options` (dentro de `computeOneScenario`).
- Repasse/lucro/margem/status: `computeOneScenario` (exportado) → `buildMercadoLivrePricingContext`.
- Margem → preço: busca binária oficial (`resolverPrecoParaMargem`), pois frete/comissão são função-degrau (sem fórmula inversa). Cap de 7 iterações.

**Fallback claro:** sem token/preço/categoria suficientes, `commission_source` indica o motivo (`no_access_token`, `missing_site_id`, `listing_prices_no_fee`, …) e o cenário usa o frete/`data_quality` da engine (`is_shipping_estimated`).

### ✅ Fiação do frontend — IMPLEMENTADA

Os cards Clássico/Premium agora consomem o resolver oficial. Ao alterar **Preço de venda** ou **Margem desejada** no popover, o frontend chama `POST /api/ml/listings/pricing-simulate-scenario` e **renderiza o cenário oficial** (comissão/tarifa, frete, repasse, lucro, margem). O frontend não calcula mais frete/comissão/repasse.

**Comportamento:**

- **Debounce ~600ms** + **cache** por `(listingExternalId, listingType, preço|margem)` e **latest-wins** (descarta resposta obsoleta). → `pricing/useSimulacaoOficialListingType.js`.
- Edita preço → envia `salePrice`; edita margem → envia `targetMarginPct` (solver oficial no backend). O campo complementar (margem/preço) é **derivado do resultado oficial** em tempo de render (sem recálculo no front, sem loop).
- **Clássico e Premium independentes** (estado/intenção por tipo).
- **Loading discreto** no popover/linha de valor enquanto recalcula; em **erro**, mantém o último cenário oficial válido e mostra aviso discreto.
- **Espelho visual aposentado:** o card do tipo alternativo deixou de usar `_pi_espelho_visual_temporario`/`enrichListingTypeCardsComPrecoEstrutural`; o baseline alternativo é simulado oficialmente no preço de referência. A projeção local (`projetarCenarioPrecificacaoLocal`) não é mais usada para os números financeiros.

**Pontos de fiação no código (frontend):**

- Serviço: `utils/simulateListingTypeScenarioOficial.js` (`apiFetch` → endpoint oficial).
- Hook: `pricing/useSimulacaoOficialListingType.js` (debounce + cache + latest-wins + loading/erro).
- Orquestração: `pricing/PricingPageSalePriceSimulator.jsx` (intenções por tipo, `obterCenarioExibicao` oficial, campo complementar derivado).
- UI de estado: `pricing/PricingScenarioSalePriceControl.jsx` e `pricing/PricingScenarioEditPopover.jsx` (spinner discreto + aviso).
- Reservas estratégicas / ML Ads continuam como camada de planejamento do seller sobre o cenário oficial (não são tarifa do ML).

## Componentes

| Camada | Arquivo | Papel |
|--------|---------|--------|
| Página | `pages/PricingIntelligencePage.jsx` | Resolve `listingId`, carrega linha, estados globais |
| Conteúdo | `components/PricingIntelligenceContent.jsx` | Simulação, cenários ML, abas, raio-x |
| Cabeçalho | `pricing/PricingPageProductHeader.jsx` | Capa, MLB, SKU, conta, indicadores |
| View-model | `pricing-intelligence/buildPricingIntelligenceSidebarMetrics.js` | Formatação do card (sem cálculo) |
| Abas | `pricing/PricingIntelligenceWorkspaceTabs.jsx` | Simulador / Promoções |
| Simulador | `pricing/PricingPageSalePriceSimulator.jsx` | Clássico/Premium + inputs |
| Inputs | `pricing/PricingPageSimulationInputs.jsx` | Preço, margem, toggles financeiros |
| Cenários | `pricing/PricingScenarioRail.jsx`, `PricingScenarioDetail.jsx` | Promoções ML |
| Gráfico | `MercadoLivrePricingScenarioCompareChart.jsx` | Barras por cenário |
| Modal legado | `AdsPricingIntelligenceModal.jsx` | Mesmo conteúdo em modal (Anúncios) |

## Hooks e serviços

| Recurso | Uso |
|---------|-----|
| `useListingsCatalogFetch` | GET `/api/ml/listings` → linha por `id` |
| `fetchListingPricingSimulationConfig` | GET config simulação por anúncio |
| `savePricingFinancialSettings` | POST settings financeiros |
| `apiFetch` + `buildApiUrl` | Todas as chamadas autenticadas |

## APIs (sem alteração de contrato nesta fase)

| Método | Endpoint | Função |
|--------|----------|--------|
| GET | `/api/ml/listings` | Catálogo + linha do anúncio + `product_card_metrics` |
| POST | `/api/ml/listings/pricing-scenarios` | Cenários Raio-x ML |
| POST | `/api/pricing/simulate` | Simulação de preço/margem |
| POST | `/api/pricing/apply` | Publicar preço (modal; não página) |
| GET/POST | `/api/ml/listings/pricing-simulation-config` | Parâmetros opcionais |
| POST | `/api/pricing/intelligent/:id/financial-settings` | Salvar toggles % |

## Estados da página

| Estado | Onde | Comportamento S1.8 |
|--------|------|---------------------|
| Loading catálogo | `PricingIntelligencePage` | Skeleton + cache sessionStorage |
| Erro catálogo | `PricingIntelligencePage` | `S7EmptyState` + retry + voltar |
| Anúncio não encontrado | `PricingIntelligencePage` | Empty + voltar |
| Loading cenários | `PricingIntelligenceContent` | Mensagem + não bloqueia layout |
| Erro cenários | `PricingIntelligenceContent` | Banner contextual + retry |
| Erro simulação | `PricingIntelligenceContent` | Aviso no painel do simulador (não topo global) |
| Métricas vazias | `PricingPageProductHeader` | `—` conforme mapa abaixo |

## Card lateral esquerdo — mapa de fontes (S1.8)

**Read model na API:** `product_card_metrics` em cada linha de `GET /api/ml/listings`, montado em:

- `historicalCardOrderItemsAggregates.js` — **fonte primária** (qty, faturamento, lucro) via `sales_order_items` + `computeSaleDetailRealResult` (Raio-X/Vendas)
- `listingProductCardMetrics.js` — monta o payload; conta inferida de `marketplace_account_id` do anúncio + votação nas linhas de pedido
- Fallback secundário: `listing_sales_metrics` (join `getListingGridRow`) só se agregação de pedidos falhar

**View-model no front:** `buildPricingIntelligenceSidebarMetrics.js` — só formatação de `product_card_metrics` (sem `sold_quantity` ML).

**Cache sessão:** `v3` — só grava linha com `product_card_metrics` completo; URL direta dispara `fetchListings` no mount.

### Identidade operacional

| Campo exibido | Origem atual | Read model | Status | Lacuna futura |
|---------------|--------------|------------|--------|---------------|
| Marketplace / capa / título / MLB / SKU | `mapGridApiToCatalogRow` ← grid ML | Grid `marketplace_listings` + capa | OK | — |
| **Conta:** (label UI) | `marketplace_accounts.account_alias` → `ml_nickname` (join na query + mapa `accountById` + `product_card_metrics.accountDisplayName`) | Mesma fonte da coluna Conta em Anúncios / Vendas (`pickCatalogAccountFields`) | OK com `marketplace_account_id` | `—` só sem vínculo de conta |

### Indicadores do anúncio (histórico Suse7 — all-time, sem período)

| Campo exibido | Origem atual | Read model | Status | Lacuna futura |
|---------------|--------------|------------|--------|---------------|
| Tipo do anúncio | `listing_type_label` | `normalizeMercadoLivreListingType` (persistido ML) | OK | — |
| Vendas Qtd | Σ `sales_order_items.quantity` por `external_listing_id` (variantes MLB) | `historicalCardOrderItemsAggregates.byListingKey` | OK | `—` sem linhas de pedido |
| Vendas R$ | Σ `gross_amount` (ou `unit_price × qty`) | Idem | OK | `—` sem faturamento nas linhas |
| Lucro R$ | Σ `computeSaleDetailRealResult` por linha | Idem + custos `products` + imposto | OK com custo/imposto | `—` sem produto/custo (igual Raio-X) |
| Lucro % | lucro ÷ faturamento (server) | Idem | OK | `—` quando lucro ausente |

**Removidos da UI (fase atual):** Visitas, Conversão, Opinião do Produto — não são métricas históricas de vendas Suse7 neste card.

### Indicadores do produto (SKU consolidado — all-time)

| Campo exibido | Origem atual | Read model | Status | Lacuna futura |
|---------------|--------------|------------|--------|---------------|
| Vendas Qtd | Σ qty por `product_id` (fallback `sku_snapshot` → SKU do anúncio) | `historicalCardOrderItemsAggregates.byProductId` | OK | `—` sem `product_id`/SKU |
| Vendas R$ | Σ gross por produto | Idem | OK | `—` |
| Lucro R$ | Σ lucro por produto | Idem | OK com custo | `—` sem custo cadastrado |
| Lucro % | Idem | Idem | OK | `—` |

**Removidos da UI (fase atual):** Qtd. de Anúncios, Estoque.

**Dependências:** sync/import de vendas (`sales_order_items`, `listing_sales_metrics`), cadastro de produto (custo, embalagem, operacional), perfil de imposto (CNPJ/conta ou `profiles.imposto_percentual`).

**Não usa nesta fase:** visitas ML, conversão, reviews, métricas temporais, filtros de período da página Vendas.

### Diagnóstico — causa raiz (fechamento)

| Sintoma | Causa raiz | Correção definitiva |
|---------|------------|-------------------|
| Conta `—` | `marketplace_account_id` ausente no listing + cache incompleto | Join `marketplace_accounts` + conta inferida das linhas de `sales_order_items` (`accountAliasByListingKey`) |
| Vendas Qtd ok, R$ `—` | `gross_revenue_missing` / join parcial em `listing_sales_metrics`; ML `sold_quantity` misturado | Qtd e R$ passam a vir de `sales_order_items` (mesma base Vendas) |
| Lucro `—` com vendas | Chave MLB errada + lucro exige `product_id`/custo (Raio-X) | `putListingGridRowValueAliases` + imposto precarregado em lote |
| URL direta errada | Cache antigo sem `product_card_metrics` | Cache `v3` incompleto ignorado + refetch no mount |
| Catálogo falha | Timeout/erro no GET listings | Página não usa cache parcial; retry + mensagem clara |

**Logs DEV:** `ML_CARD_METRICS_DEBUG=1` ou `NODE_ENV=development` → `[S7_CARD_METRICS_PROBE]` para `ML_CARD_METRICS_PROBE_EXT` (default `4615133425,4222565497`).

### Placeholders

| Situação | Exibição |
|----------|----------|
| Dado ausente | `—` |
| Lucro zero com histórico calculável | `R$ 0,00` / `0%` |
| Conta sem alias | `—` |

## Navegação

- Lista Precificações → linha / Precifica S7 → `new_tab` ou mesma aba (`listingsPageModes.pricingIntelligenceOpenTarget`)
- URL direta / refresh → cache 30 min + refetch catálogo
- Esc → volta para `/precificacoes` (no conteúdo)

## Oportunidades futuras (não implementadas)

- Endpoint GET listing por `id` (evitar catálogo completo na rota dedicada)
- Read model persistido de lucro acumulado (evitar varredura de `sales_order_items` no GET listings)
- Filtro por conta/CNPJ/período nos indicadores do card (multi-conta explícito)
- `scenarioScope` dedicado quando backend estabilizar promoções
- Gráfico Clássico vs Premium com séries reais da API
- Cards executivos / KPIs na página inteligente
- Relatórios exportáveis ligados à Central S1.7
- Aplicar preço na página (hoje só modal)
- Histórico de simulações e auditoria de alterações
