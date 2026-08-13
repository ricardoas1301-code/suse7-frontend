import {
  TERMOS_USO_BLOCOS,
  TERMOS_USO_DATA_PUBLICACAO_ROTULO,
  TERMOS_USO_TITULO_MODAL,
  TERMOS_USO_TITULO_PAGINA,
} from "../../domain/legal/termosUsoDocumento";
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
  const rootClass = [
    "s7-terms-document",
    variant === "modal" ? "s7-terms-document--modal" : "s7-terms-document--page",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={rootClass}>
      {showTitle ? (
        variant === "modal" ? (
          <h2 className="s7-terms-document__title s7-terms-document__title--modal">{TERMOS_USO_TITULO_MODAL}</h2>
        ) : (
          <h1 className="s7-terms-document__title">{TERMOS_USO_TITULO_PAGINA}</h1>
        )
      ) : null}

      {showUpdateDate ? (
        <p className="s7-terms-document__update">
          <strong>Última atualização: {TERMOS_USO_DATA_PUBLICACAO_ROTULO}</strong>
        </p>
      ) : null}

      <div className="s7-terms-document__body">
        {TERMOS_USO_BLOCOS.map((bloco, index) => (
          <TermsDocumentBlock key={`${bloco.type}-${index}`} bloco={bloco} variant={variant} />
        ))}
      </div>
    </article>
  );
}

/**
 * @param {{ bloco: import("../../domain/legal/termosUsoDocumento").TermosBloco; variant: 'page' | 'modal' }} props
 */
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

/** @param {{ parte: import("../../domain/legal/termosUsoDocumento").TermosTextoParte }} props */
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
