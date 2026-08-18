// ======================================================
// Error boundary — Precificação Inteligente (seção isolada; não derruba a rota).
// ======================================================

import { Component } from "react";

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   sectionLabel?: string;
 *   externalListingId?: string | null;
 * }} props
 */
export class PricingIntelligenceSectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    /** @type {{ hasError: boolean; message: string }} */
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(/** @type {Error} */ error) {
    return {
      hasError: true,
      message: error?.message != null ? String(error.message) : "erro_desconhecido",
    };
  }

  componentDidCatch(/** @type {Error} */ error, /** @type {import("react").ErrorInfo} */ info) {
    if (import.meta.env.DEV) {
      console.error("[S7 PI][Crash]", {
        section: this.props.sectionLabel ?? "precificacao_inteligente",
        external_listing_id: this.props.externalListingId ?? null,
        message: error?.message ?? null,
        stack: error?.stack ?? null,
        componentStack: info?.componentStack ?? null,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pricing-intelligence-page__section-fallback" role="alert">
          <p className="pricing-intelligence-page__section-fallback-title">
            Não foi possível exibir {this.props.sectionLabel ?? "esta seção"} para este anúncio.
          </p>
          <p className="pricing-intelligence-page__section-fallback-text">
            Os demais blocos da página continuam disponíveis. Se o problema persistir, sincronize o anúncio e tente
            novamente.
          </p>
          {import.meta.env.DEV && this.state.message ? (
            <p className="pricing-intelligence-page__section-fallback-dev">{this.state.message}</p>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
