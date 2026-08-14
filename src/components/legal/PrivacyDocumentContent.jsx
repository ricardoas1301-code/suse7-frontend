import { Link } from "react-router-dom";
import {
  PRIVACIDADE_BLOCOS,
  PRIVACIDADE_DATA_PUBLICACAO_ROTULO,
  PRIVACIDADE_TITULO_PAGINA,
} from "../../domain/legal/privacidadeDocumento";
import "./TermsDocumentContent.css";

export default function PrivacyDocumentContent({ className = "" }) {
  const rootClass = ["s7-terms-document", "s7-terms-document--page", className].filter(Boolean).join(" ");

  return (
    <article className={rootClass}>
      <h1 className="s7-terms-document__title">{PRIVACIDADE_TITULO_PAGINA}</h1>
      <p className="s7-terms-document__update">
        <strong>Última atualização: {PRIVACIDADE_DATA_PUBLICACAO_ROTULO}</strong>
      </p>
      <div className="s7-terms-document__body">
        {PRIVACIDADE_BLOCOS.map((bloco, index) => (
          <PrivacyDocumentBlock key={`${bloco.type}-${index}`} bloco={bloco} />
        ))}
      </div>
    </article>
  );
}

/** @param {{ bloco: import("../../domain/legal/privacidadeDocumento").PrivacidadeBloco }} props */
function PrivacyDocumentBlock({ bloco }) {
  if (bloco.type === "heading") {
    return <h2 className="s7-terms-document__subtitle">{bloco.text}</h2>;
  }

  if (bloco.type === "subheading") {
    return <h3 className="s7-terms-document__subsubsection">{bloco.text}</h3>;
  }

  if (bloco.type === "paragraph") {
    return (
      <p className="s7-terms-document__paragraph">
        {bloco.parts.map((parte, idx) => (
          <PrivacyTextPart key={idx} parte={parte} />
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
              <PrivacyTextPart key={partIdx} parte={parte} />
            ))}
          </li>
        ))}
      </ul>
    );
  }

  if (bloco.type === "contact_details") {
    return (
      <div className="s7-terms-document__contact">
        {bloco.intro ? <p className="s7-terms-document__paragraph">{bloco.intro}</p> : null}
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
      <p className="s7-terms-document__footer s7-terms-document__footer--page">
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

/** @param {{ parte: import("../../domain/legal/privacidadeDocumento").PrivacidadeTextoParte }} props */
function PrivacyTextPart({ parte }) {
  if (parte.to) {
    return (
      <Link to={parte.to} className="s7-terms-document__link">
        {parte.text}
      </Link>
    );
  }
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
