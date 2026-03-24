# Design System S7 — Regras Oficiais

Estas regras existem para manter consistência visual e acelerar o
desenvolvimento de novas telas no Suse7.

## Regra 1 — Inputs

- Nenhum `input` HTML cru nas telas.
- Sempre usar **S7FormField + S7Input**, **S7Select** ou **S7Textarea**.
- Altura visual é definida pelos estilos globais em
  `Suse7-Design-System.css` (`.s7-input`, `.s7-select`, `.s7-textarea`):
  - `padding: 6px 8px`
  - `font-size: 14px`
  - `border-radius: 8px`
  - `background: #f9fafb`
  - **sem height ou min-height fixa**.

## Regra 2 — Botões

- Nenhum `<button>` estilizado manualmente nas telas.
- Sempre usar **S7Button** (e variantes: primário, secundário, danger).

## Regra 3 — Tooltips

- Nenhum tooltip manual (title HTML, hacks de CSS, etc.).
- Sempre usar **S7Tooltip** com o padrão:
  - `placement="bottom-start"`
  - `offset={6}`

## Regra 4 — Grids e layout

- Evitar `display: grid`/`flex` complexos diretamente nas páginas.
- Preferir:
  - **S7Grid** para grades simples.
  - **S7Stack** para empilhar elementos com `gap`.
  - **S7Section** para blocos de formulário/página.
  - **S7InputGroup** para linha com input + ações.

## Regra 5 — CSS visual

- Nenhum CSS visual direto em páginas/containers de alto nível.
- CSS visual deve ficar:
  - nos componentes S7 (`src/components/ui/**`), ou
  - em arquivos do design system global (`styles/Suse7-Design-System.css`).
- Telas podem ter apenas CSS de layout específico (ex.: grid de colunas,
  largura de painéis) e posicionamento.

## Regra 6 — Componentes de formulário

- Todos os formulários devem usar:
  - **S7FormField** para label + erro + ajuda.
  - **S7Input / S7Select / S7Textarea** como campos base.
  - **S7ChipInput** quando houver campos baseados em chips/tags.
  - **S7Toggle** para liga/desliga.

## Regra 7 — Cabeçalhos e seções

- Cabeçalhos de página:
  - Usar **S7PageHeader** (`title`, `subtitle`, `actions`).
- Blocos de formulário:
  - Usar **S7Section** para agrupar campos com título e ações locais.

## Regra 8 — Tabelas

- Listagens tabulares devem usar **S7Table** como base visual.
- Lógica de ordenação/paginação pode ser construída em cima dele, mas o
  estilo base da tabela deve vir deste componente.

## Regra 9 — Evolução

- Novas necessidades de UI devem primeiro ser discutidas como **novo
  componente S7** ou extensão dos existentes.
- Evitar adicionar CSS ad-hoc em telas; em vez disso:
  - criar/estender um componente S7,
  - ou adicionar uma variação controlada (prop) em um componente
    existente.

## Regra 10 — Protocolo de Refino UX Suse7

Para evitar loops de microajustes e garantir previsibilidade, todo refino visual deve seguir este protocolo:

### 10.1 — Sempre partir de uma referência oficial

1. **Definir referência e alvo**
   - Antes de qualquer ajuste, declarar explicitamente:
     - **referência**: componente/tela que será copiado (ex.: campo NCM na aba Dados, card de Estoque na aba Estoque).
     - **alvo**: componente/tela que receberá o padrão (ex.: SKU/EAN na aba Variações).
   - Proibido trabalhar com instruções vagas do tipo “um pouco mais para a direita” ou “reduz 30%”. Sempre usar “copiar padrão X”.

### 10.2 — Classificar o tipo de ajuste (UX-TYPE)

2. **Definir obrigatoriamente o UX-TYPE da task antes de implementar**
   - **Tipo A — Ajuste sistêmico (S7)**:
     - Se o ajuste for reaproveitável em outras telas, implementar direto no Design System (componentes em `src/components/ui/**` ou em `styles/Suse7-Design-System.css`).
   - **Tipo B — Ajuste local (tela)**:
     - Se for realmente específico daquela tela, aplicar localmente, sem criar componente reutilizável artificial.

### 10.3 — Implementar no lugar correto (ordem obrigatória)

3. **Ordem de implementação**
   - 1º: ajustar/criar componente S7 (quando for Tipo A).
   - 2º: aplicar o componente ou padrão na tela.
   - 3º: só então, se necessário, fazer pequenos ajustes locais de layout (nunca reimplementar o padrão ali).
   - Proibido resolver layout complexo só com CSS local de card ou com “gambiarras” de `margin`/`padding`.

### 10.4 — Criação de componentes intermediários

4. **Criar componentes intermediários quando surgir padrão repetido**
   - Quando um padrão for usado em mais de uma tela (ex.: campo com ações no canto superior direito), criar um componente S7 dedicado (ex.: `S7FieldWithInlineActions`), com:
     - responsabilidade clara,
     - props bem definidas (`label`, `required`, `actions`, `inputProps`),
     - uso previsto em múltiplas telas.
   - Não criar componente novo apenas para resolver um caso isolado.

   - Sempre que um componente S7 novo for criado, documentar **no próprio arquivo**:
     - Nome do componente,
     - Responsabilidade,
     - Reutilização prevista (em quais telas/casos será usado).

### 10.5 — Uso obrigatório de debug visual após 2 tentativas

5. **Ativar debug quando o layout não responde**
   - Se depois de **2 rodadas** o layout ainda não respondeu como esperado:
     - ativar uma classe de debug temporária:
       - `.s7-debug-outline * { outline: 1px solid rgba(0, 0, 255, 0.2); }`
     - aplicar no container relevante e identificar:
       - quem é o container real,
       - quem controla largura/alinhamento,
       - onde o layout está quebrando.
   - Proibido continuar ajustando “no escuro”.

### 10.6 — Limite de tentativas por refino

6. **Máximo de 2 rodadas “no escuro”**
   - Cada refino visual tem, no máximo, **2 rodadas** de ajuste direto.
   - Se não resolver:
     - parar,
     - inspecionar com debug,
     - ou escalar para ajuste estrutural (Tipo A no S7).

### 10.7 — Regra de congelamento (UX freeze)

7. **Evitar desperdício em refinos que não trazem ganho**
   - Se o refino:
     - não impacta funcionalidade,
     - está consumindo tempo excessivo,
     - está gerando desgaste,
   - então:
     - congelar o refino atual,
     - registrar como pendência (“refino visual futuro”),
     - seguir para outra parte do produto.

### 10.8 — Prioridade sempre no sistema, não no pixel

8. **Sistema acima de microajustes**
   - O Suse7 é guiado por **padrões de sistema**, não por ajustes manuais de pixel.
   - Consequências práticas:
     - menos microajustes isolados,
     - mais padronização via S7,
     - mais consistência entre abas e telas.

### 10.9 — Critério de qualidade de um refino

9. **Quando um refino é considerado concluído**
   - Um refino é considerado concluído quando:
     - segue um padrão oficial já definido **ou**
     - originou um novo padrão reutilizável no S7 (documentado aqui e implementado em componente).
   - Não é considerado concluído se:
     - depende de “sentir” visualmente a cada tela,
     - não pode ser reaplicado em outra tela sem nova rodada de tentativa e erro.

### 10.10 — Registro de pendências UX (UX Backlog)

10. **Manter um backlog explícito de refinos UX**
    - Pendências de refino visual devem ser registradas em um backlog simples (arquivo markdown, issue tracker ou seção dedicada), por exemplo:
      - `UX Backlog:`
      - `- [ ] alinhar horizontalmente card de variações`
      - `- [ ] ajustar espaçamento X`
      - `- [ ] revisar comportamento Y`
    - Pendências não devem depender de memória ou histórico de conversa: sempre registrar.

### 10.11 — Confirmação de escopo antes de implementar

11. **Antes de começar qualquer refino, o escopo deve estar explícito**
    - Toda task de UX deve declarar:
      - `Referência: [componente/tela X]`
      - `Alvo: [componente/tela Y]`
      - `Tipo: [UX-TYPE-A ou UX-TYPE-B]`
    - Sem essa confirmação de escopo, o refino não deve ser iniciado.

## Regra 13 — Padrão Oficial de Tooltips (fonte única)

Para padronizar tooltips do Suse7 e eliminar divergências visuais, o tooltip validado no campo **“Formato”** da aba **Dados** passa a ser a **fonte oficial única** para o sistema.

### Adoção obrigatória (exceções controladas)
- Salvo exceções realmente justificadas e registradas, todo tooltip do Suse7 deve seguir **exatamente**:
  - mesmo ícone (ícone “i” azul em círculo branco com borda azul suave),
  - mesmo posicionamento,
  - mesma bubble (fundo escuro, texto branco, `border-radius` e sombra compatíveis com o padrão atual),
  - mesma interação (hover simples com leve crescimento do ícone).
- Proibido criar novos estilos locais de tooltip.
- Proibido variar posicionamento sem necessidade real.

### Padrão default oficial (resumo)
- **Trigger**: ícone “i” azul com fundo branco, borda azul suave; hover com leve crescimento do ícone.
- **Bubble**: fundo escuro, texto branco, raio e sombra iguais ao padrão validado.
- **Posicionamento**: idêntico ao do tooltip do campo “Formato” (aba Dados).

### Exceções / pendências
- Qualquer tooltip existente fora desse padrão deve ser listado como **pendência de migração** (não migrar automaticamente sem validação visual).

## Checklist Oficial de Tooltip Suse7

✅ Checklist — Tooltip Suse7

Antes de considerar um tooltip como pronto, validar:

🎯 Referência obrigatória

 O tooltip segue exatamente o padrão do campo Formato (aba Dados)

🎨 Trigger (ícone)

 Ícone “i” em círculo branco

 Cor azul (var(--s7-primary))

 Borda azul suave

 Tamanho: 18px

 Hover com leve scale(1.08)

 Cursor: help

💬 Bubble (tooltip)

 Fundo escuro (#0f172a)

 Texto branco

 Font-size: 11px

 Line-height: 1.2

 Padding: 6px 10px

 Border-radius: 12px

 Box-shadow: var(--s7-shadow-float)

 Sem quebra estranha de texto (white-space correto)

📐 Posicionamento

 Mesmo posicionamento do tooltip do campo Formato

 Distância consistente do ícone

 Não deslocado lateralmente

 Não “flutuando” fora do contexto visual

⚙️ Comportamento

 Aparece no hover

 Desaparece ao sair

 Sem flicker

 Sem atraso perceptível

 Não depende de JS desnecessário

🚫 Regras de bloqueio

 Não usa estilo custom fora do padrão

 Não cria novo tipo de tooltip

 Não altera z-index sem necessidade

 Não usa lógica complexa (ex: interval, hacks)

🧪 Validação final

 Comparado lado a lado com o campo Formato

 Visual idêntico (1:1)

 Aprovado sem necessidade de microajuste

📌 Observação importante

Este checklist é obrigatório para qualquer implementação ou refino de tooltip no Suse7.
O tooltip do campo Formato (aba Dados) é a fonte única de verdade.

## Regra 14 — Feedback de carregamento em cadastros e fluxos assíncronos

Operações de **salvar / enviar** que podem demorar (API, várias etapas) **não podem** deixar a tela estática sem feedback. O padrão oficial do Suse7 é **local ao formulário** (não bloquear a página inteira).

### Componentes obrigatórios (Design System)

1. **Botão de ação principal** — usar **`S7Button`** (`src/components/ui/S7Button.jsx`):
   - `loading={true}` durante a requisição,
   - `loadingLabel` padrão ou contextual (ex.: `"Salvando..."`),
   - o componente já aplica `disabled`, spinner no botão e `aria-busy`.

2. **Área do formulário** — usar **`S7FormSavingOverlay`** (`src/components/ui/S7FormSavingOverlay.jsx`):
   - renderizar com `show={estadoDeLoading}` dentro do container da área principal do cadastro,
   - o pai da overlay deve ter **`position: relative`** (ex.: classe utilitária no wrapper do form),
   - mensagem curta via prop `message` (ex.: `"Salvando produto..."` ou equivalente por fluxo).

### Comportamento obrigatório

- **Impedir double submit**: `useRef` (ex.: `submitInFlightRef`) com early return no handler + **`try` / `finally`** na função que chama a API, sempre limpando ref e estado no `finally` (sucesso, erro ou retorno antecipado após já ter ligado o loading).
- **Bloquear ações conflitantes** enquanto `loading` estiver ativo: outros botões de navegação no mesmo fluxo, fechar modal/página, troca de aba quando fizer sentido.
- **Não** usar overlay ou spinner **full-page** para esse caso; reservado a situações excepcionais explícitas no produto.

### Operações rápidas em segundo plano (complementar)

Para ações **curtas** e **não bloqueantes** (ex.: reordenar lista, pequeno PATCH), pode-se usar **`useSaveStatus`** + **`SaveStatusIndicator`** (`src/contexts/SaveStatusContext.jsx`), sem substituir o padrão acima nos **submits principais** de cadastro.

### Referência de implementação

- **Cadastro de produto**: `ProductForm.jsx` (`isSavingProduct`, `productSubmitInFlightRef`, `executeSubmit`, `S7FormSavingOverlay`, `S7Button` no último passo).

---

## Laranja oficial Suse7

- **Cor canônica:** `styles/tokens/colors.css` → **`--s7-orange`** (`#d97706`). Não copiar o hex em componentes novos.
- **Hover em superfícies âmbar:** **`--s7-orange-hover`** (`#b45309`).
- **Alias semântico (avisos discretos, toasts):** **`--s7-contextual-accent`** (igual a `--s7-orange`).
- O Design System aponta para esses tokens; valores numéricos vivem só em `colors.css`.

## Avisos contextuais não bloqueantes (padrão oficial)

Quando a mensagem é **importante**, mas **não** exige modal nem bloquear a tela:

- Preferir **toast** (`.s7-notification-toast`) ou faixa com a mesma linguagem visual.
- Barra lateral: **`var(--s7-contextual-accent)`** ou **`var(--s7-orange)`**.
- Erro crítico / interrupção: manter **`.s7-notification-toast--critical`** (vermelho).
- Referência: `NotificationToast.css` + tokens em `styles/tokens/colors.css`.

