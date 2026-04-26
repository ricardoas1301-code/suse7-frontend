import ListingsWorkspace from "../features/listings/components/ListingsWorkspace";

/** Rota dedicada à inteligência de precificação (clique na linha / S7 → `/precificacoes/inteligente/:id`, em nova aba). */
export default function PrecificacoesPage() {
  return <ListingsWorkspace mode="precificacoes" />;
}
