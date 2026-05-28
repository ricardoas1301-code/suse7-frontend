import { useCallback } from "react";
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
        <h2>Caixa de Ferramentas</h2>
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

export default function DevCenterToolbox() {
  return (
    <DevCenterOperationalConfirmProvider>
      <DevCenterOperationalFeedbackProvider>
        <DevCenterToolboxFoundationDemo />
      </DevCenterOperationalFeedbackProvider>
    </DevCenterOperationalConfirmProvider>
  );
}
