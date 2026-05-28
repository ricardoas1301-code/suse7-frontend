import { useEffect, useState } from "react";
import { devCenterGetDashboard } from "../../services/devCenterApi";

function card(label, value) {
  return { label, value: value ?? "—" };
}

export default function DevCenterDashboard() {
  const [summary, setSummary] = useState(null);
  const [phase, setPhase] = useState(/** @type {"loading" | "ok" | "error"} */ ("loading"));
  useEffect(() => {
    devCenterGetDashboard().then((r) => {
      if (r.ok) {
        setSummary(r.data?.summary ?? null);
        setPhase("ok");
      } else {
        setPhase("error");
      }
    });
  }, []);

  const cards = [
    card("Total de sellers", summary?.totalSellers),
    card("Sellers ativos", summary?.sellersAtivos),
    card("Sellers inativos", summary?.sellersInativos),
    card("Receita mensal (MRR)", summary?.mrr),
    card("Receita total", summary?.receitaTotal),
    card("Total clientes global", summary?.totalClientesGlobal),
    card("Pedidos processados", summary?.totalPedidosProcessados),
    card("Integrações ML ativas", summary?.integracoesMlAtivas),
  ];

  return (
    <section className="dc-module">
      <header className="dc-module__head">
        <h2>Dashboard</h2>
        <p className="dc-module__desc">Indicadores operacionais consolidados da plataforma.</p>
      </header>
      {phase === "loading" ? <p className="dc-module__loading">Carregando indicadores…</p> : null}
      {phase === "error" ? (
        <p className="dc-module__error">Não foi possível carregar o dashboard. Tente novamente em instantes.</p>
      ) : null}
      {phase === "ok" ? (
        <div className="dc-cards-grid">
          {cards.map((c) => (
            <article key={c.label} className="dc-card">
              <span>{c.label}</span>
              <strong>{String(c.value)}</strong>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

