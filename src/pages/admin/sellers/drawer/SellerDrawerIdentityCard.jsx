import { memo } from "react";
import SellerDrawerSection from "./SellerDrawerSection";
import { formatSellerDate } from "../sellerOpsUtils";

/**
 * @param {{
 *   seller?: Record<string, unknown> | null;
 *   identity?: Record<string, unknown> | null;
 *   listPreview?: import("../sellerOpsTypes").SellerListRow | null;
 *   state?: "loading" | "loaded" | "empty" | "error";
 * }} props
 */
function SellerDrawerIdentityCard({ seller = null, identity = null, listPreview = null, state = "loaded" }) {
  const nome = String(seller?.nome ?? listPreview?.nome ?? "—");
  const email = String(seller?.email ?? listPreview?.email ?? "—");
  const telefone = seller?.telefone ?? listPreview?.telefone ?? null;
  const documento = identity?.document_masked ?? listPreview?.cnpj ?? null;
  const cadastro = seller?.created_at ?? listPreview?.created_at ?? null;

  return (
    <SellerDrawerSection
      title="Identidade"
      subtitle="Quem é este seller"
      state={state}
      emptyMessage="Identidade indisponível no momento."
    >
      <dl className="seller-drawer-kv">
        <div className="seller-drawer-kv__row">
          <dt>Nome</dt>
          <dd>{nome}</dd>
        </div>
        <div className="seller-drawer-kv__row">
          <dt>E-mail</dt>
          <dd>{email}</dd>
        </div>
        {telefone ? (
          <div className="seller-drawer-kv__row">
            <dt>Telefone</dt>
            <dd>{String(telefone)}</dd>
          </div>
        ) : null}
        {documento ? (
          <div className="seller-drawer-kv__row">
            <dt>Documento</dt>
            <dd>{String(documento)}</dd>
          </div>
        ) : null}
        <div className="seller-drawer-kv__row">
          <dt>Cadastro</dt>
          <dd>{formatSellerDate(/** @type {string | null | undefined} */ (cadastro))}</dd>
        </div>
      </dl>
    </SellerDrawerSection>
  );
}

export default memo(SellerDrawerIdentityCard);
