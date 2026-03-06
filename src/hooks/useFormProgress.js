// ======================================================================
// HOOK: useFormProgress
// Objetivo:
// - Recalcular progresso global do ProductForm (todas as abas)
// - Funciona em "simple" e "variants"
// - Conta TODOS os inputs editáveis (não só obrigatórios)
// ======================================================================

import { useMemo } from "react";
import { calcProgress } from "../utils/formProgress";

export function useFormProgress({ product, variationAttributes, variantRows }) {
  return useMemo(() => {
    return calcProgress({ product, variationAttributes, variantRows });
  }, [product, variationAttributes, variantRows]);
}

