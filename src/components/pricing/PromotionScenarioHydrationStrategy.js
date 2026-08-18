// ======================================================
// S4.3.6.26 — Fronteira multi-marketplace da hidratação de promoções.
// Store, fila e Comparativo não conhecem endpoints específicos.
// ======================================================

/**
 * @typedef {{
 *   id: string;
 *   montarChave: (params: Record<string, unknown>) => string;
 *   hidratar: (params: Record<string, unknown>) => Promise<{
 *     ok: boolean;
 *     fromCache: boolean;
 *     cacheKey: string;
 *     revision: number;
 *     estado: unknown;
 *     error?: string;
 *   }>;
 * }} PromotionScenarioHydrationStrategy
 */

export {};
