import { useCallback, useState } from "react";
import { S7Button } from "../../components/ui";
import {
  DEV_CENTER_CATEGORIAS_RELOAD,
  DEV_CENTER_CATEGORIAS_RELOAD_ORDEM,
  rotuloCategoriaReload,
} from "../../components/devCenter/operational/devCenterOperationalReloadModel";
import {
  DevCenterOperationalConfirmModal,
  DevCenterOperationalConfirmProvider,
  DevCenterOperationalFeedbackBanner,
  DevCenterOperationalFeedbackProvider,
  useDevCenterOperationalConfirm,
  useDevCenterOperationalFeedback,
} from "../../components/devCenter/operational";
import "../../components/devCenter/operational/devCenterOperational.css";
import {
  TOOLBOX_TABS,
  TOOLBOX_TAB_PADRAO,
  TOOLBOX_GROUPS,
} from "../../components/devCenter/toolbox/devCenterToolboxTabs";
import DocumentacaoVivaPanel from "../../components/devCenter/toolbox/documentacaoViva/DocumentacaoVivaPanel";
// Admin Global ainda não promovido ao main — stub local até pasta adminGlobal/ + APIs versionadas.
// import AdminGlobalPanel from "../../components/devCenter/toolbox/adminGlobal/AdminGlobalPanel";
import CentralTemplatesPanel from "../../components/devCenter/toolbox/centralTemplates/CentralTemplatesPanel";
import ComunicacaoPanel from "../../components/devCenter/toolbox/comunicacao/ComunicacaoPanel";
import "../../components/devCenter/toolbox/devCenterToolbox.css";

function DevCenterToolboxFoundationDemo() {
  const { abrirConfirmacao } = useDevCenterOperationalConfirm();
  const { exibirFeedback } = useDevCenterOperationalFeedback();

  const demonstrarConfirmacao = useCallback(
    (nivelRisco) => {
      abrirConfirmacao({
        id: `demo_confirm_${nivelRisco}`,
        titulo: "Confirmar operação crítica?",
        descricao:
          "Modal operacional padronizado do Dev Center — reutilizável por reset de consumo, sync, invalidação de cache e ações em massa.",
        nivelRisco,
        rotuloConfirmar: "Prosseguir",
      });
    },
    [abrirConfirmacao],
  );

  const demonstrarFeedback = useCallback(
    (tipo) => {
      exibirFeedback({
        tipo,
        titulo: `Feedback operacional — ${tipo}`,
        descricao:
          "Camada compartilhada para loading, sucesso, erro e bloqueio temporário de ações duplicadas.",
        bloqueiaInteracao: tipo === "executando",
      });
    },
    [exibirFeedback],
  );

  return (
    <section className="dc-module dc-operacional-foundation">
      <header className="dc-module__head">
        <h2>Operacional</h2>
        <p className="dc-module__desc">
          S1 — Fundação operacional: reload granular, confirmação padronizada e feedback administrativo
          reutilizável.
        </p>
      </header>

      <DevCenterOperationalFeedbackBanner />

      <div className="dc-operacional-foundation__grid">
        <article className="dc-operacional-foundation__card">
          <h4>Reload granular</h4>
          <p>
            Atualiza somente blocos afetados via{" "}
            <code>useDevCenterOperationalReload()</code> — sem{" "}
            <code>window.location.reload()</code>.
          </p>
          <ul className="dc-operacional-foundation__status">
            {DEV_CENTER_CATEGORIAS_RELOAD_ORDEM.map((categoria) => (
              <li key={categoria}>
                <strong>{rotuloCategoriaReload(categoria)}</strong>
                <span> — recarregarCategoria(&apos;{categoria}&apos;)</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="dc-operacional-foundation__card">
          <h4>Confirmação operacional</h4>
          <p>Estados de risco: info, sucesso, alerta, crítico e destrutivo.</p>
          <div className="dc-operacional-foundation__actions">
            <S7Button type="button" size="sm" variant="secondary" onClick={() => demonstrarConfirmacao("alerta")}>
              Demo alerta
            </S7Button>
            <S7Button type="button" size="sm" variant="warning" onClick={() => demonstrarConfirmacao("critico")}>
              Demo crítico
            </S7Button>
            <S7Button type="button" size="sm" variant="warning" onClick={() => demonstrarConfirmacao("destrutivo")}>
              Demo destrutivo
            </S7Button>
          </div>
        </article>

        <article className="dc-operacional-foundation__card">
          <h4>Feedback operacional</h4>
          <p>Loading, sucesso, erro, destrutivo e estado executando com bloqueio opcional.</p>
          <div className="dc-operacional-foundation__actions">
            <S7Button type="button" size="sm" variant="secondary" onClick={() => demonstrarFeedback("executando")}>
              Executando
            </S7Button>
            <S7Button type="button" size="sm" variant="primary" onClick={() => demonstrarFeedback("sucesso")}>
              Sucesso
            </S7Button>
            <S7Button type="button" size="sm" variant="warning" onClick={() => demonstrarFeedback("erro")}>
              Erro
            </S7Button>
          </div>
        </article>

        <article className="dc-operacional-foundation__card">
          <h4>Integração Sellers</h4>
          <p>
            A página <strong>Sellers</strong> já consome o provider. Ações DEV de Cache/Refresh disparam reload
            granular preservando drawer, toolbox e categoria aberta.
          </p>
          <p className="dc-operacional-foundation__status">
            Dev bridge: <code>window.__S7_DEV_CENTER_OPERATIONAL__</code>
          </p>
          <p className="dc-operacional-foundation__status">
            Categorias-chave:{" "}
            <strong>{rotuloCategoriaReload(DEV_CENTER_CATEGORIAS_RELOAD.ASSINATURA)}</strong>,{" "}
            <strong>{rotuloCategoriaReload(DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES)}</strong>,{" "}
            <strong>{rotuloCategoriaReload(DEV_CENTER_CATEGORIAS_RELOAD.FEATURE_FLAGS)}</strong>
          </p>
        </article>
      </div>

      <DevCenterOperationalConfirmModal />
    </section>
  );
}

/** Placeholder para abas ainda não implementadas (padrão atual do projeto). */
function ToolboxTabPlaceholder({ label }) {
  return (
    <div className="s7-toolbox__placeholder">
      <h3>{label}</h3>
      <p>Área prevista na Caixa de Ferramentas. Será habilitada em uma próxima fase.</p>
    </div>
  );
}

/** Placeholder da aba Administração Global até a frente ser promovida ao main. */
function AdminGlobalPanel() {
  return <ToolboxTabPlaceholder label="Administração Global (em preparação)" />;
}

/** Resolve o conteúdo da aba ativa. */
function ToolboxTabContent({ tabId }) {
  if (tabId === "operacional") {
    return <DevCenterToolboxFoundationDemo />;
  }
  if (tabId === "comunicacao") {
    return <ComunicacaoPanel />;
  }
  if (tabId === "central_templates") {
    return <CentralTemplatesPanel />;
  }
  if (tabId === "documentacao_viva") {
    return <DocumentacaoVivaPanel />;
  }
  if (tabId === "admin_global") {
    return <AdminGlobalPanel />;
  }
  const tab = TOOLBOX_TABS.find((item) => item.id === tabId);
  return <ToolboxTabPlaceholder label={tab?.label ?? "Em breve"} />;
}

export default function DevCenterToolbox() {
  const [tabAtiva, setTabAtiva] = useState(TOOLBOX_TAB_PADRAO);

  return (
    <DevCenterOperationalConfirmProvider>
      <DevCenterOperationalFeedbackProvider>
        <div className="s7-toolbox">
          <header className="s7-toolbox__header">
            <h1 className="s7-toolbox__title">Caixa de Ferramentas</h1>
            <p className="s7-toolbox__subtitle">
              Centro de governança viva do Suse7 — operação, documentação viva e infraestrutura em
              um só lugar.
            </p>
          </header>

          <nav className="s7-toolbox__nav" role="tablist" aria-label="Áreas da Caixa de Ferramentas">
            {TOOLBOX_GROUPS.map((grupo) => {
              const tabsDoGrupo = TOOLBOX_TABS.filter((tab) => tab.group === grupo.id);
              if (tabsDoGrupo.length === 0) return null;
              return (
                <div key={grupo.id} className="s7-toolbox__nav-group">
                  <span className="s7-toolbox__nav-group-label" title={grupo.hint}>
                    {grupo.label}
                  </span>
                  <div className="s7-toolbox__nav-group-tabs">
                    {tabsDoGrupo.map((tab) => {
                      const Icon = tab.icon;
                      const ativa = tab.id === tabAtiva;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={ativa}
                          disabled={!tab.enabled}
                          className={`s7-toolbox__nav-btn ${ativa ? "s7-toolbox__nav-btn--active" : ""}`}
                          onClick={() => tab.enabled && setTabAtiva(tab.id)}
                        >
                          <Icon size={16} aria-hidden /> {tab.label}
                          {!tab.enabled ? <span className="s7-toolbox__nav-soon">em breve</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <ToolboxTabContent tabId={tabAtiva} />
        </div>
      </DevCenterOperationalFeedbackProvider>
    </DevCenterOperationalConfirmProvider>
  );
}
