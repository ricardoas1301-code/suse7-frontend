// ======================================================
// DOCUMENTAÇÃO VIVA — STORE HÍBRIDO + GOVERNANÇA (S1_1.10 / S1_1.11A)
// ------------------------------------------------------
// Camada de estado com transição progressiva local → Supabase:
//
// - SEED inicial: localStorage (fallback) ou model.
// - Ao montar: tenta carregar do BACKEND (/api/dev-center/...).
//     • backend OK com dados   → adota remoto (fonte = "remote") + histórico remoto.
//     • backend OK porém vazio  → mantém local (backend disponível).
//     • backend indisponível    → mantém local (fonte = "local").
// - Toda edição é LOCAL-FIRST (state + localStorage); a UX nunca quebra.
// - Quando fonte = "remote", as edições são sincronizadas em BEST-EFFORT.
//
// GOVERNANÇA (S1_1.11A):
//   • trilha histórica local (before/after + operador + timestamp);
//   • homologação registra quem/quando;
//   • domínio homologado que sofre alteração reabre para "Em revisão".
//   A persistência oficial do histórico é no backend (espelhada aqui).
// ======================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  criarItemVazio,
  hojeISO,
  agoraISO,
  listarDominiosDocumentacao,
  normalizarDominio,
  metaStatusDocumentacao,
  DOC_STATUS,
  DOC_OPERADOR_LOCAL,
} from "./documentacaoVivaModel";
import {
  montarPayloadCriarDominio,
  montarPayloadDominio,
  montarPayloadSecao,
  normalizarDominioRemoto,
} from "./documentacaoVivaContract";
import {
  DOC_OPERACAO,
  criarEntradaHistorico,
  descreverMudancasDominio,
  mapEntradaRemota,
  ordenarHistorico,
} from "./documentacaoVivaHistory";
import {
  fetchDocumentacaoViva,
  fetchDocumentacaoVivaHistory,
  createDocumentacaoVivaDomain,
  saveDocumentacaoVivaDomain,
  saveDocumentacaoVivaSection,
} from "../../../../services/documentacaoVivaApi";
import { DocumentacaoVivaContext } from "./documentacaoVivaContext";

const STORAGE_KEY = "s7_docviva_state_v1";

/** Fontes possíveis do estado. */
export const DOC_FONTE = Object.freeze({ LOCAL: "local", REMOTE: "remote" });

/** Histórico inicial de seed (apenas demonstração da timeline da Página Vendas). */
function historicoInicial() {
  return [
    {
      ...criarEntradaHistorico({
        domain_id: "dom_vendas",
        domain_slug: "vendas",
        operation_type: DOC_OPERACAO.DOMAIN_CREATED,
        label: "Domínio criado: Página Vendas",
        operator_name: DOC_OPERADOR_LOCAL,
      }),
      created_at: "2026-03-01T09:00:00.000Z",
    },
    {
      ...criarEntradaHistorico({
        domain_id: "dom_vendas",
        domain_slug: "vendas",
        operation_type: DOC_OPERACAO.HOMOLOGATED,
        label: `Domínio homologado por ${DOC_OPERADOR_LOCAL}`,
        operator_name: DOC_OPERADOR_LOCAL,
      }),
      created_at: "2026-06-01T12:00:00.000Z",
    },
  ];
}

/**
 * Lê o estado salvo localmente (ou null se não houver/for inválido).
 * Normaliza cada domínio para preencher campos novos (governança) sem perder edições.
 */
function carregarEstadoLocal() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto);
    if (!Array.isArray(parsed?.domains)) return null;
    return {
      domains: parsed.domains.map(normalizarDominio),
      historico: Array.isArray(parsed.historico) ? parsed.historico : [],
    };
  } catch {
    return null;
  }
}

/** Persiste o estado atual localmente (cache/fallback). */
function persistirEstadoLocal(domains, historico) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ domains, historico, savedAt: Date.now() }),
    );
  } catch {
    // Persistência local é best-effort — falha não quebra a UX.
  }
}

/**
 * Provider do store híbrido. Seeds local + tentativa de carga remota.
 */
export function DocumentacaoVivaProvider({ children }) {
  const estadoInicial = carregarEstadoLocal();
  const [domains, setDomains] = useState(() => estadoInicial?.domains ?? listarDominiosDocumentacao());
  const [historico, setHistorico] = useState(() => estadoInicial?.historico ?? historicoInicial());
  const [fonte, setFonte] = useState(DOC_FONTE.LOCAL);
  const [carregando, setCarregando] = useState(true);

  // Refs para acesso a valores atuais dentro de callbacks assíncronos.
  const domainsRef = useRef(domains);
  const fonteRef = useRef(fonte);
  useEffect(() => {
    domainsRef.current = domains;
  }, [domains]);
  useEffect(() => {
    fonteRef.current = fonte;
  }, [fonte]);

  // Evita persistir na primeira renderização (apenas em mudanças reais).
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    persistirEstadoLocal(domains, historico);
  }, [domains, historico]);

  /** Tenta carregar do backend; em falha, mantém o estado local. */
  const recarregarDoBackend = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetchDocumentacaoViva();
      if (res.ok && Array.isArray(res.domains) && res.domains.length > 0) {
        setDomains(res.domains.map(normalizarDominioRemoto));
        setFonte(DOC_FONTE.REMOTE);
        // Histórico remoto (best-effort): não quebra a adoção dos domínios.
        try {
          const hist = await fetchDocumentacaoVivaHistory();
          if (hist.ok && Array.isArray(hist.history)) {
            setHistorico(ordenarHistorico(hist.history.map(mapEntradaRemota)));
          }
        } catch {
          // mantém histórico atual
        }
      } else {
        // backend indisponível OU ainda sem dados → segue local (sem perder nada)
        setFonte(DOC_FONTE.LOCAL);
      }
    } catch {
      setFonte(DOC_FONTE.LOCAL);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carga inicial do backend (uma vez).
  useEffect(() => {
    recarregarDoBackend();
  }, [recarregarDoBackend]);

  /** Executa uma sincronização remota apenas quando fonte = remote (best-effort). */
  const sincronizarRemoto = useCallback(async (fn) => {
    if (fonteRef.current !== DOC_FONTE.REMOTE) return;
    try {
      await fn();
    } catch {
      // Best-effort: a falha de sync não quebra a UX (estado local já salvo).
    }
  }, []);

  /** Adiciona entradas à trilha histórica local (mais recente primeiro). */
  const registrarHistorico = useCallback((entradas) => {
    const lista = Array.isArray(entradas) ? entradas : [entradas];
    if (lista.length === 0) return;
    setHistorico((atual) => ordenarHistorico([...lista, ...atual]));
  }, []);

  /** Salva os campos de um domínio (nome, descrição, status, owner, maturidade, revisão). */
  const salvarDominio = useCallback(
    (slug, patch) => {
      const atual = domainsRef.current.find((d) => d.domain_slug === slug);
      if (!atual) return;

      const statusMudou = patch.status !== undefined && patch.status !== atual.status;
      const camposConteudo = ["domain_name", "description", "owner", "maturity", "next_review_at"];
      const conteudoMudou = camposConteudo.some(
        (campo) => patch[campo] !== undefined && patch[campo] !== atual[campo],
      );

      // Reabertura automática (S1_1.11A.10).
      const reabrir = atual.status === DOC_STATUS.HOMOLOGADO && !statusMudou && conteudoMudou;
      // Homologação (S1_1.11A.8).
      const homologou =
        patch.status === DOC_STATUS.HOMOLOGADO && atual.status !== DOC_STATUS.HOMOLOGADO;

      const patchFinal = { ...patch, last_operator: DOC_OPERADOR_LOCAL, updated_at: hojeISO() };
      if (reabrir) patchFinal.status = DOC_STATUS.EM_REVISAO;
      if (homologou) {
        patchFinal.homologated_at = agoraISO();
        patchFinal.homologated_by = DOC_OPERADOR_LOCAL;
      }

      setDomains((atuais) =>
        atuais.map((dominio) =>
          dominio.domain_slug === slug ? { ...dominio, ...patchFinal } : dominio,
        ),
      );

      // Trilha histórica.
      const eventos = descreverMudancasDominio(atual, patch).map((ev) =>
        criarEntradaHistorico({
          domain_id: atual.domain_id,
          domain_slug: slug,
          operation_type: ev.operation_type,
          label:
            ev.operation_type === DOC_OPERACAO.HOMOLOGATED
              ? `Domínio homologado por ${DOC_OPERADOR_LOCAL}`
              : ev.label,
          operator_name: DOC_OPERADOR_LOCAL,
          before: ev.before,
          after: ev.after,
        }),
      );
      if (reabrir) {
        eventos.push(
          criarEntradaHistorico({
            domain_id: atual.domain_id,
            domain_slug: slug,
            operation_type: DOC_OPERACAO.GOVERNANCE_REOPENED,
            label: "Governança reaberta automaticamente (Em revisão)",
            operator_name: DOC_OPERADOR_LOCAL,
            before: { status: atual.status },
            after: { status: DOC_STATUS.EM_REVISAO },
          }),
        );
      }
      registrarHistorico(eventos);

      if (atual.domain_db_id) {
        sincronizarRemoto(() =>
          saveDocumentacaoVivaDomain(atual.domain_db_id, montarPayloadDominio(patch)),
        );
      }
    },
    [sincronizarRemoto, registrarHistorico],
  );

  /** Substitui os itens de uma seção (commit do editor de seção). */
  const salvarSecao = useCallback(
    (slug, sectionId, items) => {
      const atual = domainsRef.current.find((d) => d.domain_slug === slug);
      if (!atual) return;

      const secao = atual.sections.find((s) => s.section_id === sectionId);
      const reabrir = atual.status === DOC_STATUS.HOMOLOGADO;
      const carimbados = items.map((item) => ({ ...item, updated_at: hojeISO() }));

      setDomains((atuais) =>
        atuais.map((dominio) => {
          if (dominio.domain_slug !== slug) return dominio;
          const base = {
            ...dominio,
            updated_at: hojeISO(),
            last_operator: DOC_OPERADOR_LOCAL,
            sections: dominio.sections.map((s) =>
              s.section_id === sectionId ? { ...s, items: carimbados } : s,
            ),
          };
          if (reabrir) base.status = DOC_STATUS.EM_REVISAO;
          return base;
        }),
      );

      const eventos = [
        criarEntradaHistorico({
          domain_id: atual.domain_id,
          domain_slug: slug,
          section_id: sectionId,
          operation_type: DOC_OPERACAO.SECTION_UPDATED,
          label: `Seção atualizada: ${secao?.section_title ?? sectionId}`,
          operator_name: DOC_OPERADOR_LOCAL,
          before: { items: secao?.items ?? [] },
          after: { items: carimbados },
        }),
      ];
      if (reabrir) {
        eventos.push(
          criarEntradaHistorico({
            domain_id: atual.domain_id,
            domain_slug: slug,
            operation_type: DOC_OPERACAO.GOVERNANCE_REOPENED,
            label: "Governança reaberta automaticamente (Em revisão)",
            operator_name: DOC_OPERADOR_LOCAL,
            before: { status: DOC_STATUS.HOMOLOGADO },
            after: { status: DOC_STATUS.EM_REVISAO },
          }),
        );
      }
      registrarHistorico(eventos);

      if (secao?.section_db_id) {
        sincronizarRemoto(() =>
          saveDocumentacaoVivaSection(secao.section_db_id, montarPayloadSecao({ items })),
        );
      }
    },
    [sincronizarRemoto, registrarHistorico],
  );

  /** Cria um novo domínio (já em Rascunho — ver criarDominioRascunho). */
  const adicionarDominio = useCallback(
    (dominio) => {
      setDomains((atuais) => [...atuais, dominio]);

      registrarHistorico(
        criarEntradaHistorico({
          domain_id: dominio.domain_id,
          domain_slug: dominio.domain_slug,
          operation_type: DOC_OPERACAO.DOMAIN_CREATED,
          label: `Domínio criado: ${dominio.domain_name}`,
          operator_name: DOC_OPERADOR_LOCAL,
          after: { name: dominio.domain_name, status: dominio.status },
        }),
      );

      if (fonteRef.current === DOC_FONTE.REMOTE) {
        sincronizarRemoto(async () => {
          const res = await createDocumentacaoVivaDomain(
            montarPayloadCriarDominio({
              domain_name: dominio.domain_name,
              description: dominio.description,
            }),
          );
          // Após criar no backend, recarrega para obter os IDs reais + histórico.
          if (res.ok) await recarregarDoBackend();
        });
      }
    },
    [sincronizarRemoto, recarregarDoBackend, registrarHistorico],
  );

  /** Restaura o seed do model e limpa o estado local (útil para validação). */
  const restaurarPadrao = useCallback(() => {
    setDomains(listarDominiosDocumentacao());
    setHistorico(historicoInicial());
    setFonte(DOC_FONTE.LOCAL);
  }, []);

  /** Trilha histórica de um domínio (mais recente primeiro). */
  const historicoDoDominio = useCallback(
    (domain) => {
      if (!domain) return [];
      return ordenarHistorico(
        historico.filter(
          (e) =>
            (domain.domain_id && e.domain_id === domain.domain_id) ||
            (domain.domain_db_id && e.domain_id === domain.domain_db_id) ||
            (domain.domain_slug && e.domain_slug && e.domain_slug === domain.domain_slug),
        ),
      );
    },
    [historico],
  );

  const value = useMemo(
    () => ({
      domains,
      historico,
      fonte,
      carregando,
      recarregarDoBackend,
      salvarDominio,
      salvarSecao,
      adicionarDominio,
      restaurarPadrao,
      historicoDoDominio,
      criarItemVazio,
      metaStatusDocumentacao,
    }),
    [
      domains,
      historico,
      fonte,
      carregando,
      recarregarDoBackend,
      salvarDominio,
      salvarSecao,
      adicionarDominio,
      restaurarPadrao,
      historicoDoDominio,
    ],
  );

  return (
    <DocumentacaoVivaContext.Provider value={value}>{children}</DocumentacaoVivaContext.Provider>
  );
}
