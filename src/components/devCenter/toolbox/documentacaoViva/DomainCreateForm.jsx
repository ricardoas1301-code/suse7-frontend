import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { S7Input, S7Textarea, S7Button } from "../../../ui";
import DocVivaStatusBadge from "./DocVivaStatusBadge";
import { criarDominioRascunho, metaStatusDocumentacao, DOC_STATUS } from "./documentacaoVivaModel";

// Criação de novo domínio (S1_1.9A.6).
// Todo domínio novo nasce obrigatoriamente em RASCUNHO.

/**
 * @param {{ onCreate: (dominio: import("./documentacaoVivaModel").DocDomain) => string }} props
 */
export default function DomainCreateForm({ onCreate }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  const rascunhoMeta = metaStatusDocumentacao(DOC_STATUS.RASCUNHO);

  const fechar = () => {
    setAberto(false);
    setNome("");
    setDescricao("");
    setErro("");
  };

  const criar = () => {
    if (!nome.trim()) {
      setErro("Informe o nome do domínio.");
      return;
    }
    onCreate(criarDominioRascunho(nome.trim(), descricao.trim()));
    fechar();
  };

  if (!aberto) {
    return (
      <S7Button type="button" variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAberto(true)}>
        Novo domínio
      </S7Button>
    );
  }

  return (
    <div className="s7-docviva-create">
      <div className="s7-docviva-create__head">
        <h4 className="s7-docviva-create__title">Novo domínio</h4>
        <DocVivaStatusBadge label={rascunhoMeta.label} tone={rascunhoMeta.tone} />
      </div>
      <p className="s7-docviva-create__hint">
        Todo domínio nasce em <strong>Rascunho</strong> e pode evoluir pelo fluxo de homologação.
      </p>

      <S7Input
        label="Nome do domínio"
        name="novo_dominio_nome"
        value={nome}
        placeholder="Ex.: Relatórios"
        error={erro}
        onChange={(event) => {
          setNome(event.target.value);
          if (erro) setErro("");
        }}
      />
      <S7Textarea
        label="Descrição"
        name="novo_dominio_descricao"
        rows={2}
        value={descricao}
        placeholder="Resumo curto do domínio"
        onChange={(event) => setDescricao(event.target.value)}
      />

      <div className="s7-docviva-create__actions">
        <S7Button type="button" variant="secondary" size="sm" icon={<X size={14} />} onClick={fechar}>
          Cancelar
        </S7Button>
        <S7Button type="button" variant="primary" size="sm" icon={<Save size={14} />} onClick={criar}>
          Criar rascunho
        </S7Button>
      </div>
    </div>
  );
}
