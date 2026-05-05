import { useEffect, useState } from "react";
import { devCenterGetFinance } from "../../services/devCenterApi";

export default function DevCenterFinance() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    devCenterGetFinance().then((r) => {
      if (r.ok) setSummary(r.data?.summary ?? null);
    });
  }, []);

  return (
    <section className="dc-module">
      <header className="dc-module__head"><h2>Financeiro</h2></header>
      <div className="dc-cards-grid">
        <article className="dc-card"><span>Receita total</span><strong>{summary?.receitaTotalBrl ?? "—"}</strong></article>
        <article className="dc-card"><span>MRR</span><strong>{summary?.mrrBrl ?? "—"}</strong></article>
        <article className="dc-card"><span>ARR</span><strong>{summary?.arrBrl ?? "—"}</strong></article>
      </div>
    </section>
  );
}

