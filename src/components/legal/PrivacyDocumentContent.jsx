import { Link } from "react-router-dom";

import { usePoliticaPrivacidadeCatalogo } from "../../hooks/usePoliticaPrivacidadeCatalogo.js";

import "./TermsDocumentContent.css";



/**

 * @param {{ className?: string }} props

 */

export default function PrivacyDocumentContent({ className = "" }) {

  const { catalog, loading, error } = usePoliticaPrivacidadeCatalogo();



  const rootClass = ["s7-terms-document", "s7-terms-document--page", className].filter(Boolean).join(" ");



  if (loading) {

    return (

      <article className={rootClass} role="status" aria-live="polite">

        <p className="s7-terms-document__paragraph">Carregando Política de Privacidade…</p>

      </article>

    );

  }



  if (error || !catalog) {

    return (

      <article className={rootClass} role="alert">

        <p className="s7-terms-document__paragraph">

          {error ?? "Não foi possível carregar a Política de Privacidade."}

        </p>

      </article>

    );

  }



  return (

    <article className={rootClass}>

      <h1 className="s7-terms-document__title">{catalog.title_page}</h1>

      <p className="s7-terms-document__update">

        <strong>Última atualização: {catalog.published_at_label}</strong>

      </p>

      <div className="s7-terms-document__body">

        {catalog.blocks.map((bloco, index) => (

          <PrivacyDocumentBlock key={`${bloco.type}-${index}`} bloco={bloco} />

        ))}

      </div>

    </article>

  );

}



/** @param {{ bloco: import("../../domain/legal/privacidadeDocumento.js").PrivacidadeBloco }} props */

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



/** @param {{ parte: import("../../domain/legal/privacidadeDocumento.js").PrivacidadeTextoParte }} props */

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

