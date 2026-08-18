import { useMemo, useState } from "react";
import { RefreshCw, AlertTriangle, Flag, Plus } from "lucide-react";
import { S7Button, S7Input } from "../../../ui";
import FeatureEditCard from "./FeatureEditCard";
import PlanFeatureMatrix from "./PlanFeatureMatrix";
import { useAdminFeaturesStore } from "./adminFeaturesContext";
import { useAdminGlobalStore } from "./adminGlobalContext";
import { useAdminConfirm } from "./security/adminConfirmContext";
import { indexarVinculos } from "./adminFeaturesModel";

// Gestão Administrativa de Features Globais (S1_4).
// Catálogo (criar/editar/habilitar/desabilitar) + matriz Plano × Feature.

export default function FeaturesPanel() {
  const {
    features,
    assignments,
    carregando,
    erro,
    degradado,
    salvandoId,
    recarregar,
    criarFeature,
    salvarFeature,
    definirVinculo,
  } = useAdminFeaturesStore();
  const { plans } = useAdminGlobalStore();
  const { pedirConfirmacaoDupla } = useAdminConfirm();

  const [novaAberta, setNovaAberta] = useState(false);
  const [nova, setNova] = useState({ label: "", category: "" });
  const [feedbackNova, setFeedbackNova] = useState(null);

  const vinculoIndex = useMemo(() => indexarVinculos(assignments), [assignments]);

  const toggleStatus = (feature) => {
    const ativar = feature.status !== "ativa";
    pedirConfirmacaoDupla({
      titulo: ativar ? `Habilitar "${feature.label}"?` : `Desabilitar "${feature.label}"?`,
      descricao: ativar
        ? "A feature passará a estar ativa globalmente no Suse7."
        : "A feature será desligada globalmente para todo o ecossistema. Sellers podem perder acesso.",
      critico: true,
      rotuloConfirmar: ativar ? "Habilitar" : "Desabilitar",
      onConfirm: async () => {
        await salvarFeature(feature.id, { status: ativar ? "ativa" : "inativa" });
      },
    });
  };

  const criar = async () => {
    if (!nova.label.trim()) {
      setFeedbackNova("Informe o nome da feature.");
      return;
    }
    const res = await criarFeature({ label: nova.label.trim(), category: nova.category.trim() || undefined });
    if (res.ok) {
      setNova({ label: "", category: "" });
      setNovaAberta(false);
      setFeedbackNova(null);
    } else {
      setFeedbackNova(res.error || "Falha ao criar feature.");
    }
  };

  return (
    <div className="s7-admin-features">
      <div className="s7-admin-features__head">
        <div>
          <h3 className="s7-admin-features__title">
            <Flag size={18} aria-hidden /> Features Globais
          </h3>
          <p className="s7-admin-features__subtitle">
            Catálogo oficial de funcionalidades liberáveis do Suse7. Status controla a feature flag
            global; a matriz define o vínculo por plano.
          </p>
        </div>
        <div className="s7-admin-features__head-actions">
          <S7Button type="button" variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setNovaAberta((v) => !v)}>
            Nova feature
          </S7Button>
          <S7Button type="button" variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={recarregar} disabled={carregando}>
            Recarregar
          </S7Button>
        </div>
      </div>

      {degradado ? (
        <div className="s7-admin-features__aviso">
          Catálogo em modo preparatório — aplique a migration de features para persistência completa.
        </div>
      ) : null}

      {novaAberta ? (
        <div className="s7-admin-features__nova">
          <S7Input
            label="Nome da feature"
            name="nova_feature_label"
            value={nova.label}
            onChange={(e) => setNova((n) => ({ ...n, label: e.target.value }))}
          />
          <S7Input
            label="Categoria (opcional)"
            name="nova_feature_cat"
            value={nova.category}
            onChange={(e) => setNova((n) => ({ ...n, category: e.target.value }))}
          />
          <div className="s7-admin-features__nova-actions">
            <S7Button type="button" variant="primary" size="sm" onClick={criar} disabled={salvandoId === "__nova__"}>
              {salvandoId === "__nova__" ? "Criando…" : "Criar feature"}
            </S7Button>
          </div>
          {feedbackNova ? <p className="s7-admin-features__nova-feedback">{feedbackNova}</p> : null}
        </div>
      ) : null}

      {erro ? (
        <div className="s7-admin-plans__erro" role="alert">
          <AlertTriangle size={16} aria-hidden />
          <span>{erro}</span>
          <S7Button type="button" variant="secondary" size="sm" onClick={recarregar}>
            Tentar novamente
          </S7Button>
        </div>
      ) : null}

      {carregando && features.length === 0 ? (
        <div className="s7-admin-plans__loading">Carregando features…</div>
      ) : (
        <>
          <div className="s7-admin-features__grid">
            {features.map((feature) => (
              <FeatureEditCard
                key={feature.id}
                feature={feature}
                salvando={salvandoId === feature.id}
                onSave={salvarFeature}
                onToggleStatus={toggleStatus}
              />
            ))}
          </div>

          <section className="s7-admin-features__matrix-sec">
            <h4 className="s7-admin-features__matrix-title">Vínculo Plano × Feature</h4>
            <PlanFeatureMatrix
              plans={plans}
              features={features}
              vinculoIndex={vinculoIndex}
              onToggle={definirVinculo}
            />
          </section>
        </>
      )}
    </div>
  );
}
