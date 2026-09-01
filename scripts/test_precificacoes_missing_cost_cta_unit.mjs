import assert from "node:assert/strict";
import {
  getListingProductLinkActions,
  shouldShowCadastrarCustosListaRow,
} from "../src/features/listings/utils/listingProductLinkActions.js";
import { ATTENTION_REASON_SKU_PENDING_ML } from "../src/constants/listingAttention.js";

function rowBase(overrides = {}) {
  return {
    productId: "prod-1",
    isProductReady: true,
    attentionReason: null,
    initialSyncUniverseStable: true,
    pricingContext: {
      product_health: { product_health_status: "READY" },
    },
    ...overrides,
  };
}

// CASO 1 — custo existente (produto pronto)
assert.equal(shouldShowCadastrarCustosListaRow(rowBase({ isProductReady: true })), false);

// CASO 2 — custo ausente (cadastro incompleto)
assert.equal(
  shouldShowCadastrarCustosListaRow(
    rowBase({
      isProductReady: false,
      pricingContext: { product_health: { product_health_status: "INCOMPLETE_PRODUCT" } },
    }),
  ),
  true,
);

// CASO 3 — custo zero segue regra canônica: produto pronto => sem CTA
assert.equal(
  shouldShowCadastrarCustosListaRow(
    rowBase({
      isProductReady: true,
      pricingContext: { product_health: { product_health_status: "READY" } },
    }),
  ),
  false,
);

// CASO 4 — lucro ausente por outro motivo, custo cadastrado
assert.equal(
  shouldShowCadastrarCustosListaRow(
    rowBase({
      isProductReady: true,
      pricingContext: { product_health: { product_health_status: "READY" } },
    }),
  ),
  false,
);

// CASO 5 — SKU existente + custo ausente
assert.equal(
  shouldShowCadastrarCustosListaRow(
    rowBase({
      isProductReady: false,
      pricingContext: { product_health: { product_health_status: "INCOMPLETE_PRODUCT" } },
    }),
  ),
  true,
);

// CASO 6 — SKU ausente + custo ausente: política canônica (sem productId => sem Cadastrar Custos)
const skuECustoAusentes = rowBase({
  productId: null,
  isProductReady: false,
  attentionReason: ATTENTION_REASON_SKU_PENDING_ML,
  pricingContext: { product_health: { product_health_status: "INCOMPLETE_PRODUCT" } },
});
const linkSkuCusto = getListingProductLinkActions(skuECustoAusentes, () => {});
assert.equal(shouldShowCadastrarCustosListaRow(skuECustoAusentes), false);
assert.equal(linkSkuCusto.showInformSkuMl, true);
assert.equal(linkSkuCusto.showCompletar, false);

// Sem productId e MISSING_PRODUCT => Vincular, não Cadastrar Custos
const missingProduct = rowBase({
  productId: "",
  isProductReady: false,
  pricingContext: { product_health: { product_health_status: "MISSING_PRODUCT" } },
});
const linkMissing = getListingProductLinkActions(missingProduct, () => {});
assert.equal(shouldShowCadastrarCustosListaRow(missingProduct), false);
assert.equal(linkMissing.showVincular, true);

// SKU + custo ausente com productId: dependência de SKU sempre precede custos
const skuPendenteComProduto = rowBase({
  isProductReady: false,
  attentionReason: ATTENTION_REASON_SKU_PENDING_ML,
  pricingContext: { product_health: { product_health_status: "INCOMPLETE_PRODUCT" } },
});
const linkAmbos = getListingProductLinkActions(skuPendenteComProduto, () => {});
assert.equal(shouldShowCadastrarCustosListaRow(skuPendenteComProduto), false);
assert.equal(linkAmbos.showInformSkuMl, true);
assert.equal(linkAmbos.showCompletar, false);

console.log("[test_precificacoes_missing_cost_cta_unit] OK");
