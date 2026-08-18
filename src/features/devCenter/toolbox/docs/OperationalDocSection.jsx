import CopyableCodeBlock from "./CopyableCodeBlock";

export default function OperationalDocSection({ section }) {
  return (
    <section className="operational-docs__section" aria-label={section?.title ?? "Secao"}>
      <h4 className="operational-docs__section-title">{section?.title}</h4>
      {section?.description ? <p className="operational-docs__section-desc">{section.description}</p> : null}
      {section?.content ? <CopyableCodeBlock content={section.content} language={section.language || "text"} /> : null}
    </section>
  );
}
