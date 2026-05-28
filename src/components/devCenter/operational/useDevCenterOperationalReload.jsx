import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { devCenterGetSellerDetail, devCenterGetSellers } from "../../../services/devCenterApi";
import { formatDetailFreshnessLabel } from "../ops/opsPresentation";
import {
  DEV_CENTER_CATEGORIAS_RELOAD,
  DEV_CENTER_CATEGORIAS_RELOAD_ORDEM,
  normalizarCategoriasReload,
  resolverCategoriasReload,
  resolverCategoriasReloadPorPaineis,
} from "./devCenterOperationalReloadModel";
import { logDevCenterOperacional } from "./devCenterOperationalLog";

/** @typedef {import("./devCenterOperationalReloadModel").DevCenterCategoriaReload} DevCenterCategoriaReload */

/**
 * @typedef {{
 *   revalidando: boolean;
 *   recarregandoLista: boolean;
 *   categoriasRecarregando: DevCenterCategoriaReload[];
 *   bloqueiaAcao: boolean;
 *   fetchedAt: number | null;
 *   versoesCategoria: Record<string, number>;
 *   rotuloFreshness: string | null;
 *   recarregarLista: () => Promise<{ ok: boolean }>;
 *   recarregarResumoSeller: () => Promise<{ ok: boolean }>;
 *   recarregarCategoria: (categoriaId: string) => Promise<{ ok: boolean }>;
 *   recarregarCategorias: (categorias: string[]) => Promise<{ ok: boolean }>;
 *   recarregarAssinatura: () => Promise<{ ok: boolean }>;
 *   recarregarIntegracoes: () => Promise<{ ok: boolean }>;
 *   recarregarFeatureFlags: () => Promise<{ ok: boolean }>;
 *   recarregarPorPaineis: (paineis: string[]) => Promise<{ ok: boolean }>;
 *   estaRecarregandoCategoria: (categoriaId: string) => boolean;
 * }} DevCenterOperationalReloadValue
 */

/** @type {import("react").Context<DevCenterOperationalReloadValue | null>} */
const DevCenterOperationalReloadContext = createContext(null);

let devBridgeInicializado = false;

/**
 * @param {{
 *   sellerId: string | null;
 *   detail: import("../../../pages/admin/sellers/sellerOpsTypes").SellerDetailPayload | null;
 *   setDetail: import("react").Dispatch<
 *     import("react").SetStateAction<
 *       import("../../../pages/admin/sellers/sellerOpsTypes").SellerDetailPayload | null
 *     >
 *   >;
 *   setRows: import("react").Dispatch<
 *     import("react").SetStateAction<import("../../../pages/admin/sellers/sellerOpsTypes").SellerListRow[]>
 *   >;
 *   children: import("react").ReactNode;
 * }} props
 */
export function DevCenterOperationalReloadProvider({
  sellerId,
  detail,
  setDetail,
  setRows,
  children,
}) {
  const [revalidando, setRevalidando] = useState(false);
  const [recarregandoLista, setRecarregandoLista] = useState(false);
  const [categoriasRecarregando, setCategoriasRecarregando] = useState(
    /** @type {DevCenterCategoriaReload[]} */ ([]),
  );
  const [fetchedAt, setFetchedAt] = useState(/** @type {number | null} */ (null));
  const [versoesCategoria, setVersoesCategoria] = useState(/** @type {Record<string, number>} */ ({}));

  const estadoRef = useRef({
    revalidando,
    recarregandoLista,
    categoriasRecarregando,
    fetchedAt,
    versoesCategoria,
  });
  estadoRef.current = {
    revalidando,
    recarregandoLista,
    categoriasRecarregando,
    fetchedAt,
    versoesCategoria,
  };

  const bloqueiaAcaoRef = useRef(false);
  bloqueiaAcaoRef.current = revalidando || recarregandoLista || categoriasRecarregando.length > 0;

  useEffect(() => {
    if (detail && sellerId) {
      setFetchedAt(Date.now());
    }
  }, [detail, sellerId]);

  const marcarCategorias = useCallback((categorias, ativo) => {
    setCategoriasRecarregando((atual) => {
      const conjunto = new Set(atual);
      for (const categoria of categorias) {
        if (ativo) conjunto.add(categoria);
        else conjunto.delete(categoria);
      }
      return DEV_CENTER_CATEGORIAS_RELOAD_ORDEM.filter((item) => conjunto.has(item));
    });
  }, []);

  const incrementarVersaoCategorias = useCallback((categorias) => {
    setVersoesCategoria((atual) => {
      const proximo = { ...atual };
      for (const categoria of categorias) {
        proximo[categoria] = (proximo[categoria] ?? 0) + 1;
      }
      return proximo;
    });
  }, []);

  const buscarListaSellers = useCallback(async () => {
    const resposta = await devCenterGetSellers();
    if (!resposta.ok) return { ok: false };

    const sellers = Array.isArray(resposta.data?.sellers) ? resposta.data.sellers : [];
    setRows(sellers);
    incrementarVersaoCategorias([DEV_CENTER_CATEGORIAS_RELOAD.LISTA_SELLERS]);
    return { ok: true, total: sellers.length };
  }, [incrementarVersaoCategorias, setRows]);

  const buscarResumoSeller = useCallback(async () => {
    if (!sellerId) return { ok: false };

    const resposta = await devCenterGetSellerDetail(sellerId);
    if (!resposta.ok || !resposta.data) return { ok: false };

    setDetail(resposta.data);
    setFetchedAt(Date.now());
    incrementarVersaoCategorias([DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER]);
    return { ok: true };
  }, [incrementarVersaoCategorias, sellerId, setDetail]);

  const recarregarLista = useCallback(async () => {
    if (recarregandoLista) {
      logDevCenterOperacional("acao_bloqueada", { motivo: "lista_em_andamento" });
      return { ok: false };
    }

    setRecarregandoLista(true);
    marcarCategorias([DEV_CENTER_CATEGORIAS_RELOAD.LISTA_SELLERS], true);
    logDevCenterOperacional("reload_lista_iniciado");

    try {
      const resultado = await buscarListaSellers();
      if (resultado.ok) {
        logDevCenterOperacional("reload_lista_concluido", { total: resultado.total });
      } else {
        logDevCenterOperacional("reload_lista_falhou");
      }
      return { ok: resultado.ok };
    } finally {
      setRecarregandoLista(false);
      marcarCategorias([DEV_CENTER_CATEGORIAS_RELOAD.LISTA_SELLERS], false);
    }
  }, [buscarListaSellers, marcarCategorias, recarregandoLista]);

  const recarregarResumoSeller = useCallback(async () => {
    if (!sellerId) return { ok: false };

    if (revalidando) {
      logDevCenterOperacional("acao_bloqueada", { motivo: "resumo_em_andamento", sellerId });
      return { ok: false };
    }

    setRevalidando(true);
    marcarCategorias([DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER], true);
    logDevCenterOperacional("reload_resumo_iniciado", { sellerId });

    try {
      const resultado = await buscarResumoSeller();
      if (resultado.ok) {
        logDevCenterOperacional("reload_resumo_concluido", { sellerId });
      } else {
        logDevCenterOperacional("reload_resumo_falhou", { sellerId });
      }
      return { ok: resultado.ok };
    } finally {
      setRevalidando(false);
      marcarCategorias([DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER], false);
    }
  }, [buscarResumoSeller, marcarCategorias, revalidando, sellerId]);

  const executarReloadCategorias = useCallback(
    async (categoriasEntrada) => {
      const categorias = normalizarCategoriasReload(categoriasEntrada);
      if (categorias.length === 0) return { ok: true };

      if (bloqueiaAcaoRef.current) {
        logDevCenterOperacional("acao_bloqueada", { motivo: "reload_categoria", categorias });
        return { ok: false };
      }

      logDevCenterOperacional("reload_categoria_iniciado", { categorias });
      marcarCategorias(categorias, true);

      if (categorias.some((categoria) => categoria !== DEV_CENTER_CATEGORIAS_RELOAD.LISTA_SELLERS)) {
        setRevalidando(true);
      }
      if (categorias.includes(DEV_CENTER_CATEGORIAS_RELOAD.LISTA_SELLERS)) {
        setRecarregandoLista(true);
      }

      let ok = true;

      try {
        if (categorias.includes(DEV_CENTER_CATEGORIAS_RELOAD.LISTA_SELLERS)) {
          const resultado = await buscarListaSellers();
          ok = ok && resultado.ok;
        }

        const precisaResumo =
          categorias.includes(DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER) ||
          categorias.includes(DEV_CENTER_CATEGORIAS_RELOAD.ASSINATURA) ||
          categorias.includes(DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES) ||
          categorias.includes(DEV_CENTER_CATEGORIAS_RELOAD.FEATURE_FLAGS);

        if (precisaResumo && sellerId) {
          const resultado = await buscarResumoSeller();
          ok = ok && resultado.ok;
        }

        const categoriasLocais = categorias.filter(
          (categoria) =>
            categoria === DEV_CENTER_CATEGORIAS_RELOAD.TOOLBOX ||
            categoria === DEV_CENTER_CATEGORIAS_RELOAD.TIMELINE,
        );

        if (categoriasLocais.length > 0) {
          incrementarVersaoCategorias(categoriasLocais);
        }

        if (ok) {
          logDevCenterOperacional("reload_categoria_concluido", { categorias });
        } else {
          logDevCenterOperacional("reload_categoria_falhou", { categorias });
        }

        return { ok };
      } finally {
        setRevalidando(false);
        setRecarregandoLista(false);
        marcarCategorias(categorias, false);
      }
    },
    [buscarListaSellers, buscarResumoSeller, incrementarVersaoCategorias, marcarCategorias, sellerId],
  );

  const recarregarCategoria = useCallback(
    (categoriaId) => executarReloadCategorias(resolverCategoriasReload(categoriaId)),
    [executarReloadCategorias],
  );

  const recarregarCategorias = useCallback(
    (categorias) => executarReloadCategorias(categorias),
    [executarReloadCategorias],
  );

  const recarregarPorPaineis = useCallback(
    (paineis) => executarReloadCategorias(resolverCategoriasReloadPorPaineis(paineis)),
    [executarReloadCategorias],
  );

  const recarregarAssinatura = useCallback(
    () => recarregarCategoria(DEV_CENTER_CATEGORIAS_RELOAD.ASSINATURA),
    [recarregarCategoria],
  );

  const recarregarIntegracoes = useCallback(
    () => recarregarCategoria(DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES),
    [recarregarCategoria],
  );

  const recarregarFeatureFlags = useCallback(
    () => recarregarCategoria(DEV_CENTER_CATEGORIAS_RELOAD.FEATURE_FLAGS),
    [recarregarCategoria],
  );

  const estaRecarregandoCategoria = useCallback(
    (categoriaId) => {
      const categorias = resolverCategoriasReload(categoriaId);
      return categorias.some((categoria) => categoriasRecarregando.includes(categoria));
    },
    [categoriasRecarregando],
  );

  const bloqueiaAcao = revalidando || recarregandoLista || categoriasRecarregando.length > 0;

  const rotuloFreshness = useMemo(() => {
    const contrato = detail && typeof detail === "object" ? /** @type {Record<string, unknown>} */ (detail) : null;
    return formatDetailFreshnessLabel(fetchedAt, contrato, { revalidating: revalidando });
  }, [detail, fetchedAt, revalidando]);

  const value = useMemo(
    () => ({
      revalidando,
      recarregandoLista,
      categoriasRecarregando,
      bloqueiaAcao,
      fetchedAt,
      versoesCategoria,
      rotuloFreshness,
      recarregarLista,
      recarregarResumoSeller,
      recarregarCategoria,
      recarregarCategorias,
      recarregarAssinatura,
      recarregarIntegracoes,
      recarregarFeatureFlags,
      recarregarPorPaineis,
      estaRecarregandoCategoria,
    }),
    [
      revalidando,
      recarregandoLista,
      categoriasRecarregando,
      bloqueiaAcao,
      fetchedAt,
      versoesCategoria,
      rotuloFreshness,
      recarregarLista,
      recarregarResumoSeller,
      recarregarCategoria,
      recarregarCategorias,
      recarregarAssinatura,
      recarregarIntegracoes,
      recarregarFeatureFlags,
      recarregarPorPaineis,
      estaRecarregandoCategoria,
    ],
  );

  useEffect(() => {
    if (!import.meta.env.DEV || devBridgeInicializado || typeof window === "undefined") return;
    devBridgeInicializado = true;

    window.__S7_DEV_CENTER_OPERATIONAL__ = {
      get: () => estadoRef.current,
      recarregarCategoria: (categoriaId) => value.recarregarCategoria(String(categoriaId)),
      recarregarResumoSeller: () => value.recarregarResumoSeller(),
      recarregarLista: () => value.recarregarLista(),
    };
  }, [value]);

  return (
    <DevCenterOperationalReloadContext.Provider value={value}>
      {children}
    </DevCenterOperationalReloadContext.Provider>
  );
}

export function useDevCenterOperationalReload() {
  const contexto = useContext(DevCenterOperationalReloadContext);
  if (!contexto) {
    throw new Error(
      "useDevCenterOperationalReload deve ser usado dentro de DevCenterOperationalReloadProvider",
    );
  }
  return contexto;
}

/** @returns {DevCenterOperationalReloadValue | null} */
export function useDevCenterOperationalReloadOpcional() {
  return useContext(DevCenterOperationalReloadContext);
}
