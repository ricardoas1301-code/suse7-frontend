import { useMemo, useState } from "react";
import OperationalDocCard from "./OperationalDocCard";
import OperationalDocSection from "./OperationalDocSection";
import { operationalDocsCatalog } from "./operationalDocsCatalog";
import "./operationalDocs.css";

export default function OperationalDocsLibrary() {
  const [selectedId, setSelectedId] = useState(operationalDocsCatalog[0]?.id ?? null);

  const selectedDoc = useMemo(
    () => operationalDocsCatalog.find((doc) => doc.id === selectedId) ?? operationalDocsCatalog[0] ?? null,
    [selectedId]
  );

  return (
    <section className="operational-docs" aria-label="Docs Operacionais">
      <header className="operational-docs__header">
        <h2 className="operational-docs__title">Docs Operacionais</h2>
        <p className="operational-docs__subtitle">
          Biblioteca versionada para homologacao operacional sem depender de arquivos locais no Windows.
        </p>
      </header>

      <div className="operational-docs__grid">
        <aside className="operational-docs__catalog" aria-label="Catalogo de runbooks">
          {operationalDocsCatalog.map((doc) => (
            <OperationalDocCard
              key={doc.id}
              doc={doc}
              active={doc.id === selectedDoc?.id}
              onSelect={setSelectedId}
            />
          ))}
        </aside>

        <article className="operational-docs__content" aria-label={selectedDoc?.title ?? "Documento operacional"}>
          <h3 className="operational-docs__content-title">{selectedDoc?.title}</h3>
          <p className="operational-docs__content-description">{selectedDoc?.description}</p>

          <div className="operational-docs__sections">
            {(selectedDoc?.sections ?? []).map((section) => (
              <OperationalDocSection key={section.id} section={section} />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
