# Design System S7 — Componentes UI

Este diretório concentra os componentes visuais reutilizáveis do Suse7.
Eles não contêm regras de negócio; apenas layout, estilo e pequenas regras
de UX que se aplicam ao sistema inteiro.

## Componentes principais

- **S7Button**: botão padrão (primário, secundário, perigo, etc.).
- **S7Input**: campo de texto simples.
- **S7Select**: select padrão (combobox).
- **S7Textarea**: campo de texto multilinha.
- **S7FormField**: rótulo + ajuda + erro + layout do campo.
- **S7Tooltip**: tooltip padrão (`placement="bottom-start"`, `offset={6}`).
- **S7Card**: bloco/card de conteúdo.
- **S7Grid**: grid responsivo simples.
- **S7Stack**: empilhamento vertical/horizontal com gap.
- **S7ActionBar**: barra de ações no topo de telas/listagens.
- **S7EmptyState**: estados vazios (sem resultados).
- **S7StatCard**: cartões de indicadores (métricas).
- **S7Icon**: ícone padrão integrando a lib de ícones.

## Novos blocos de layout

- **S7Section**  
  Bloco de seção de formulário/página.

  ```jsx
  <S7Section title="Variações">
    {/* conteúdo da seção */}
  </S7Section>
  ```

- **S7InputGroup**  
  Agrupa inputs e botões na mesma linha.

  ```jsx
  <S7InputGroup>
    <S7Input />
    <S7Button>Gerar</S7Button>
  </S7InputGroup>
  ```

- **S7ChipInput**  
  Campo com chips (tags) reutilizável.

  ```jsx
  <S7ChipInput value={chips} onChange={setChips} />
  ```

- **S7Toggle**  
  Switch padrão com label e descrição opcional.

  ```jsx
  <S7Toggle
    label="Gerar SKU automaticamente"
    checked={autoSku}
    onChange={setAutoSku}
  />
  ```

- **S7PageHeader**  
  Cabeçalho de página (título + actions).

  ```jsx
  <S7PageHeader
    title="Produtos"
    subtitle="Gerencie o catálogo da sua loja"
    actions={<S7Button>Novo produto</S7Button>}
  />
  ```

- **S7Table**  
  Tabela básica para listagens.

  ```jsx
  <S7Table
    columns={[
      { key: "sku", label: "SKU" },
      { key: "name", label: "Nome" },
    ]}
    rows={rows}
  />
  ```

## Como usar nas telas

Nas telas, importe sempre do índice:

```jsx
import { S7FormField, S7Input, S7Button } from "./ui";
```

Regra geral: telas não devem criar inputs/botões/tooltip crus; sempre
usar os componentes S7 exportados por este diretório.

