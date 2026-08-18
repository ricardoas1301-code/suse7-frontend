// ======================================================================
// Testes unitários — classificadores de filtros rápidos Concorrência.
// Executar: node ./scripts/test_concorrencia_quick_filters_unit.mjs
// ======================================================================

import assert from "node:assert/strict";
import {
  anuncioAtendeFiltroRapidoConcorrencia,
  resolverChaveCoberturaMonitoramento,
  resolverChavePosicaoPreco,
  resolverChaveReputacaoConcorrente,
  isConcorrenteInativoMonitorado,
  isFreteGratisConcorrente,
  isConcorrenteLogisticaFull,
  normalizarIdFiltroRapidoConcorrencia,
} from "../src/features/concorrencia/domain/competitionHealthListClassifiers.js";
import { CONCORRENCIA_QUICK_FILTER_OPTIONS } from "../src/features/concorrencia/filters/competitionQuickFiltersConfig.js";
import {
  concorrenteAtendeFiltroContextual,
  contarMatchesContextuaisConcorrentes,
  isContextualCompetitorFilter,
  linhaAtendeFiltroListaConcorrencia,
  montarSlotsConcorrentesContextuais,
  ordenarLinhasPorMatchesContextuais,
} from "../src/features/concorrencia/domain/competitionContextualFilterPresentation.js";

function ctx(competitors, ownListing = { price: "100.00" }, competitorsCount = competitors.length) {
  return { competitors, competitorsCount, ownListing };
}

const ativo = (overrides = {}) => ({
  id: "c1",
  competitor_listing_status: "active",
  last_seen_price: "90.00",
  reputation: { power_seller_status: "platinum", level_id: "5_green" },
  shipping: { free_shipping: true, logistic_type: "fulfillment" },
  ...overrides,
});

// 1. Sem concorrente
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(ctx([], { price: "100" }, 0), "without"),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(ctx([], { price: "100" }, 0), "with"),
  false,
);

// 2. Com concorrente válido
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(ctx([ativo()], { price: "100" }, 1), "with"),
  true,
);

// 3–4. Monitoramento completo / incompleto
assert.equal(resolverChaveCoberturaMonitoramento(6), "complete_monitoring");
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(ctx(new Array(6).fill(ativo()), { price: "100" }, 6), "complete"),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(ctx([ativo()], { price: "100" }, 2), "incomplete"),
  true,
);

// 5–7. Posição de preço
assert.equal(resolverChavePosicaoPreco({ price: "80.00" }, [ativo({ last_seen_price: "90.00" })]), "cheaper");
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([ativo({ last_seen_price: "90.00" })], { price: "80.00" }),
    "cheaper",
  ),
  true,
);
assert.equal(resolverChavePosicaoPreco({ price: "92.00" }, [ativo({ last_seen_price: "90.00" })]), "competitive");
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([ativo({ last_seen_price: "90.00" })], { price: "92.00" }),
    "competitive",
  ),
  true,
);
assert.equal(resolverChavePosicaoPreco({ price: "120.00" }, [ativo({ last_seen_price: "90.00" })]), "more_expensive");
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([ativo({ last_seen_price: "90.00" })], { price: "120.00" }),
    "more_expensive",
  ),
  true,
);

// 8–9. Frete grátis / Full
assert.equal(isFreteGratisConcorrente({ free_shipping: true }), true);
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(ctx([ativo()]), "free_shipping_competitors"),
  true,
);
assert.equal(isConcorrenteLogisticaFull({ logistic_type: "fulfillment" }), true);
assert.equal(anuncioAtendeFiltroRapidoConcorrencia(ctx([ativo()]), "full_competitors"), true);

// 10. Inativo
const inativo = { id: "c2", competitor_listing_status: "paused", is_active: true };
assert.equal(isConcorrenteInativoMonitorado(inativo), true);
assert.equal(anuncioAtendeFiltroRapidoConcorrencia(ctx([inativo]), "inactive_competitors"), true);

// 11–15. Reputação
assert.equal(resolverChaveReputacaoConcorrente({ power_seller_status: "platinum" }), "platinum");
assert.equal(anuncioAtendeFiltroRapidoConcorrencia(ctx([ativo()]), "platinum"), true);
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([ativo({ reputation: { power_seller_status: "gold" } })]),
    "gold",
  ),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([ativo({ reputation: { power_seller_status: "silver" } })]),
    "mercado_lider",
  ),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([ativo({ reputation: { level_id: "5_green" } })]),
    "green_reputation",
  ),
  true,
);
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([ativo({ reputation: { level_id: "1_red" } })]),
    "no_reputation",
  ),
  true,
);

// 16. Múltiplos concorrentes mesma categoria — uma linha
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([
      ativo({ id: "c1", reputation: { power_seller_status: "platinum" } }),
      ativo({ id: "c2", reputation: { power_seller_status: "platinum" } }),
    ]),
    "platinum",
  ),
  true,
);

// 17. Categorias diferentes — filtro específico
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([
      ativo({ id: "c1", reputation: { power_seller_status: "platinum" } }),
      ativo({ id: "c2", reputation: { power_seller_status: "gold" } }),
    ]),
    "gold",
  ),
  true,
);

// 18. Concorrente inválido (is_active false) não conta em reputação ativa
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(
    ctx([{ id: "x", is_active: false, reputation: { power_seller_status: "platinum" } }]),
    "platinum",
  ),
  false,
);

// Menu — 15 opções; sem Competitivos nem Maior pressão de preço
assert.equal(CONCORRENCIA_QUICK_FILTER_OPTIONS.length, 15);
assert.equal(
  CONCORRENCIA_QUICK_FILTER_OPTIONS.some((o) => o.id === "competitive"),
  false,
);
assert.equal(
  CONCORRENCIA_QUICK_FILTER_OPTIONS.some((o) => /pressão de preço/i.test(o.label)),
  false,
);

// S1.6 — filtros contextuais por concorrente
assert.equal(isContextualCompetitorFilter("more_expensive"), true);
assert.equal(isContextualCompetitorFilter("top_sales"), false);
assert.equal(isContextualCompetitorFilter("with"), false);

const ownListing120 = { price: "120.00" };
const compBarato = ativo({ id: "cheap", last_seen_price: "90.00" });
const compCaro = ativo({ id: "expensive", last_seen_price: "130.00" });
const compGold = ativo({
  id: "gold",
  reputation: { power_seller_status: "gold" },
});
const compPlatinum = ativo({
  id: "plat",
  reputation: { power_seller_status: "platinum" },
});

assert.equal(
  concorrenteAtendeFiltroContextual(compBarato, "more_expensive", ownListing120),
  true,
);
assert.equal(
  concorrenteAtendeFiltroContextual(compCaro, "more_expensive", ownListing120),
  false,
);
assert.equal(contarMatchesContextuaisConcorrentes([compBarato, compCaro], "more_expensive", ownListing120), 1);

const slotsMoreExpensive = montarSlotsConcorrentesContextuais(
  [compCaro, compBarato],
  "more_expensive",
  ownListing120,
  6,
);
assert.equal(slotsMoreExpensive[0].competitor?.id, "cheap");
assert.equal(slotsMoreExpensive[0].contextualMuted, false);
assert.equal(slotsMoreExpensive[1].competitor?.id, "expensive");
assert.equal(slotsMoreExpensive[1].contextualMuted, true);

const slotsGold = montarSlotsConcorrentesContextuais(
  [compPlatinum, compGold, compBarato],
  "gold",
  ownListing120,
  6,
);
assert.equal(slotsGold[0].competitor?.id, "gold");
assert.equal(slotsGold[0].contextualMuted, false);
assert.equal(slotsGold[1].contextualMuted, true);

const rowA = {
  monitored_listing_id: "a",
  competitors: [compBarato, compCaro, compPlatinum],
  own_listing: ownListing120,
  sales_count: 10,
};
const rowB = {
  monitored_listing_id: "b",
  competitors: [compBarato, compBarato, compBarato],
  own_listing: ownListing120,
  sales_count: 100,
};
const sorted = ordenarLinhasPorMatchesContextuais(
  [rowA, rowB],
  "more_expensive",
  (row) => row.competitors,
  (row) => row.own_listing,
  (row) => row.sales_count,
);
assert.equal(sorted[0].monitored_listing_id, "b");

// S1.6.1 — Mais baratos: entrada por match individual (paridade com Mais caros)
const own100 = { price: "100.00" };
const compMaisBaratoQueNos = (id, price = "90.00") => ativo({ id, last_seen_price: price });
const compMaisCaroQueNos = (id, price = "110.00") => ativo({ id, last_seen_price: price });

// Divergência agregado vs contextual — causa raiz da missão
const linhaParcialCheaper = [compMaisBaratoQueNos("below"), compMaisCaroQueNos("above")];
assert.equal(
  anuncioAtendeFiltroRapidoConcorrencia(ctx(linhaParcialCheaper, own100), "cheaper"),
  false,
);
assert.equal(
  linhaAtendeFiltroListaConcorrencia(ctx(linhaParcialCheaper, own100), "cheaper"),
  true,
);
assert.equal(contarMatchesContextuaisConcorrentes(linhaParcialCheaper, "cheaper", own100), 1);

// Mais caros permanece no predicate agregado (inalterado)
assert.equal(
  linhaAtendeFiltroListaConcorrencia(
    ctx([ativo({ last_seen_price: "90.00" })], { price: "120.00" }),
    "more_expensive",
  ),
  true,
);
assert.equal(
  linhaAtendeFiltroListaConcorrencia(
    ctx([ativo({ last_seen_price: "90.00" })], { price: "92.00" }),
    "more_expensive",
  ),
  false,
);

// Cenário A — 6 matches, posição superior na ordenação
const seisMatches = Array.from({ length: 6 }, (_, i) =>
  compMaisCaroQueNos(`m${i}`, String(110 + i)),
);
assert.equal(linhaAtendeFiltroListaConcorrencia(ctx(seisMatches, own100), "cheaper"), true);
assert.equal(contarMatchesContextuaisConcorrentes(seisMatches, "cheaper", own100), 6);

// Cenário B — 5 matches + 1 não match
const cincoMaisUm = [
  ...Array.from({ length: 5 }, (_, i) => compMaisCaroQueNos(`hit${i}`)),
  compMaisBaratoQueNos("miss"),
];
assert.equal(linhaAtendeFiltroListaConcorrencia(ctx(cincoMaisUm, own100), "cheaper"), true);
const slotsB = montarSlotsConcorrentesContextuais(cincoMaisUm, "cheaper", own100, 6);
assert.equal(slotsB.filter((s) => s.competitor && !s.contextualMuted).length, 5);
assert.equal(slotsB.filter((s) => s.competitor && s.contextualMuted).length, 1);
assert.equal(slotsB[0].contextualMuted, false);
assert.equal(slotsB[5].contextualMuted, true);

// Cenário C — 3 matches + 3 não matches
const tresMaisTres = [
  compMaisCaroQueNos("h1"),
  compMaisBaratoQueNos("m1"),
  compMaisCaroQueNos("h2"),
  compMaisBaratoQueNos("m2"),
  compMaisCaroQueNos("h3"),
  compMaisBaratoQueNos("m3"),
];
assert.equal(linhaAtendeFiltroListaConcorrencia(ctx(tresMaisTres, own100), "cheaper"), true);
const slotsC = montarSlotsConcorrentesContextuais(tresMaisTres, "cheaper", own100, 6);
assert.equal(slotsC.slice(0, 3).every((s) => !s.contextualMuted), true);
assert.equal(slotsC.slice(3, 6).every((s) => s.contextualMuted), true);

// Cenário D — 1 match + 5 não matches
const umMaisCinco = [
  compMaisBaratoQueNos("m1"),
  compMaisBaratoQueNos("m2"),
  compMaisCaroQueNos("only"),
  compMaisBaratoQueNos("m3"),
  compMaisBaratoQueNos("m4"),
  compMaisBaratoQueNos("m5"),
];
assert.equal(linhaAtendeFiltroListaConcorrencia(ctx(umMaisCinco, own100), "cheaper"), true);
assert.equal(contarMatchesContextuaisConcorrentes(umMaisCinco, "cheaper", own100), 1);

// Cenário E — 0 matches, excluída
const zeroMatches = [
  compMaisBaratoQueNos("a"),
  compMaisBaratoQueNos("b"),
  compMaisBaratoQueNos("c"),
];
assert.equal(linhaAtendeFiltroListaConcorrencia(ctx(zeroMatches, own100), "cheaper"), false);

// Cenário F — 10 concorrentes, match na posição original 9 (índice 8)
const dezComMatchTardio = Array.from({ length: 10 }, (_, i) =>
  ativo({ id: `c${i}`, last_seen_price: i === 8 ? "110.00" : "90.00" }),
);
assert.equal(linhaAtendeFiltroListaConcorrencia(ctx(dezComMatchTardio, own100), "cheaper"), true);
const slotsF = montarSlotsConcorrentesContextuais(dezComMatchTardio, "cheaper", own100, 6);
assert.equal(slotsF[0].competitor?.id, "c8");
assert.equal(slotsF[0].contextualMuted, false);

// Cenário G — ordenação A(6) → B(4) → C(1)
const rowCheaperA = {
  monitored_listing_id: "A",
  competitors: seisMatches,
  own_listing: own100,
  sales_count: 1,
};
const rowCheaperB = {
  monitored_listing_id: "B",
  competitors: Array.from({ length: 4 }, (_, i) => compMaisCaroQueNos(`b${i}`)),
  own_listing: own100,
  sales_count: 999,
};
const rowCheaperC = {
  monitored_listing_id: "C",
  competitors: [compMaisCaroQueNos("solo")],
  own_listing: own100,
  sales_count: 9999,
};
const sortedCheaper = ordenarLinhasPorMatchesContextuais(
  [rowCheaperC, rowCheaperB, rowCheaperA],
  "cheaper",
  (row) => row.competitors,
  (row) => row.own_listing,
  (row) => row.sales_count,
);
assert.deepEqual(
  sortedCheaper.map((row) => row.monitored_listing_id),
  ["A", "B", "C"],
);

// Alias URL legado
assert.equal(normalizarIdFiltroRapidoConcorrencia("inactive"), "inactive_competitors");

console.log(
  "[OK] test_concorrencia_quick_filters_unit — 31 cenários (classificadores + menu + contextual S1.6 + cheaper S1.6.1)",
);
