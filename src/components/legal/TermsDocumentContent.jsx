import { useTermosUsoCatalogo } from "../../hooks/useTermosUsoCatalogo.js";
import "./TermsDocumentContent.css";

/**
 * @param {{ variant?: 'page' | 'modal'; showTitle?: boolean; showUpdateDate?: boolean; className?: string }} props
 */
export default function TermsDocumentContent({
  variant = "page",
  showTitle = true,
  showUpdateDate = true,
  className = "",
}) {
  const { catalog, loading, error } = useTermosUsoCatalogo();

  const rootClass = [
    "s7-terms-document",
    variant === "modal" ? "s7-terms-document--modal" : "s7-terms-document--page",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <article className={rootClass} role="status" aria-live="polite">
        <p className="s7-terms-document__paragraph">Carregando Termos de Uso…</p>
      </article>
    );
  }

  if (error || !catalog) {
    return (
      <article className={rootClass} role="alert">
        <p className="s7-terms-document__paragraph">{error ?? "Não foi possível carregar os Termos de Uso."}</p>
      </article>
    );
  }

  return (
    <article className={rootClass}>
      {showTitle ? (
        variant === "modal" ? (
          <h2 className="s7-terms-document__title s7-terms-document__title--modal">{catalog.title_modal}</h2>
        ) : (
          <h1 className="s7-terms-document__title">{catalog.title_page}</h1>
        )
      ) : null}

      {showUpdateDate ? (
        <p className="s7-terms-document__update">
          <strong>Última atualização: {catalog.published_at_label}</strong>
        </p>
      ) : null}

      <div className="s7-terms-document__body">
        {catalog.blocks.map((bloco, index) => (
          <TermsDocumentBlock key={`${bloco.type}-${index}`} bloco={bloco} variant={variant} />
        ))}
      </div>
    </article>
  );
}

/** @param {{ bloco: import("../../domain/legal/termosUsoDocumento.js").TermosBloco; variant: 'page' | 'modal' }} props */
function TermsDocumentBlock({ bloco, variant }) {
  if (bloco.type === "heading") {
    const HeadingTag = variant === "page" ? "h2" : "h3";
    return <HeadingTag className="s7-terms-document__subtitle">{bloco.text}</HeadingTag>;
  }

  if (bloco.type === "paragraph") {
    return (
      <p className="s7-terms-document__paragraph">
        {bloco.parts.map((parte, idx) => (
          <TermsTextPart key={idx} parte={parte} />
        ))}
      </p>
    );
  }

  if (bloco.type === "list") {
    return (
      <ul className="s7-terms-document__list">
        {bloco.items.map((item, idx) => (
          <li key={idx}>
            {item.map((parte, partIdx) => (
              <TermsTextPart key={partIdx} parte={parte} />
            ))}
          </li>
        ))}
      </ul>
    );
  }

  if (bloco.type === "contact") {
    return (
      <p className="s7-terms-document__paragraph">
        📧 <strong>{bloco.email}</strong>
        <br />
        🌐 {bloco.website}
      </p>
    );
  }

  if (bloco.type === "contact_details") {
    return (
      <div className="s7-terms-document__contact">
        <p className="s7-terms-document__paragraph">{bloco.intro}</p>
        {bloco.lines.map((line, idx) => (
          <p className="s7-terms-document__contact-line" key={idx}>
            {line.boldLabel && !line.value ? (
              <strong>{line.label}</strong>
            ) : (
              <>
                <strong>{line.label}</strong>{" "}
                {line.href ? (
                  <a href={line.href} className="s7-terms-document__link">
                    {line.value}
                  </a>
                ) : line.value ? (
                  <span>{line.value}</span>
                ) : null}
              </>
            )}
          </p>
        ))}
      </div>
    );
  }

  if (bloco.type === "footer") {
    return (
      <p className={`s7-terms-document__footer${variant === "page" ? " s7-terms-document__footer--page" : ""}`}>
        <strong>
          {bloco.parts.map((parte, idx) => (
            <span key={idx}>{parte.text}</span>
          ))}
        </strong>
      </p>
    );
  }

  return null;
}

/** @param {{ parte: import("../../domain/legal/termosUsoDocumento.js").TermosTextoParte }} props */
function TermsTextPart({ parte }) {
  if (parte.href) {
    return (
      <a href={parte.href} className="s7-terms-document__link">
        {parte.text}
      </a>
    );
  }
  if (parte.bold) {
    return <strong>{parte.text}</strong>;
  }
  return <span>{parte.text}</span>;
}
