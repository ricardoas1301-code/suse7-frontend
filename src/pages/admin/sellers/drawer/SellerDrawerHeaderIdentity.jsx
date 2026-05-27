import { memo } from "react";

/**
 * @param {{
 *   nome: string;
 *   email: string | null;
 *   secondaryId: string;
 *   photoUrl: string | null;
 *   initial: string;
 *   loading?: boolean;
 * }} props
 */
function SellerDrawerHeaderIdentity({
  nome,
  email,
  secondaryId,
  photoUrl,
  initial,
  loading = false,
}) {
  const secondary = email || secondaryId;

  return (
    <div className="seller-drawer-header__identity">
      {loading ? (
        <span className="seller-drawer-header__avatar seller-drawer-header__avatar--skeleton" aria-hidden />
      ) : photoUrl ? (
        <img src={String(photoUrl)} alt="" className="seller-drawer-header__avatar" />
      ) : (
        <span className="seller-drawer-header__avatar seller-drawer-header__avatar--placeholder" aria-hidden>
          {initial}
        </span>
      )}

      <div className="seller-drawer-header__identity-copy">
        {loading ? (
          <>
            <span className="seller-drawer-header__skeleton seller-drawer-header__skeleton--title" aria-hidden />
            <span className="seller-drawer-header__skeleton seller-drawer-header__skeleton--subtitle" aria-hidden />
          </>
        ) : (
          <>
            <h3 id="dc-seller-drawer-title" className="seller-drawer-header__name">{nome}</h3>
            <p
              className={`seller-drawer-header__secondary${email ? "" : " seller-drawer-header__secondary--mono"}`}
              title={secondary}
            >
              {secondary}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(SellerDrawerHeaderIdentity);
