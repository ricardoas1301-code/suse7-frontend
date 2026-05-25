# Dev Center — Clientes Globais

Documentação final do módulo **Clientes Globais** (admin cross-seller).  
Epic **S_4 ENCERRADO** — S_4.1 → S_4.9.4 (build, responsividade, QA manual, documentação, checkpoint final).

> **Princípio:** backend interpreta, frontend renderiza.  
> **Fronteira:** admin global isolado do domínio seller (Clientes360).

---

## 1. Visão geral

O módulo **Clientes Globais** permite que operadores autorizados do Dev Center consultem clientes deduplicados em toda a plataforma (`s7_global_customers`), com visão agregada cross-seller, summary operacional e drawer de detalhe enriquecido.

| Aspecto | Descrição |
|---------|-----------|
| **Escopo** | Admin global (`summary.scope = admin_global`) |
| **Consumidor UI** | `DevCenterCustomersGlobal.jsx` |
| **API client** | `devCenterApi.js` — somente endpoints `customers-global` |
| **Proibido na UI** | `/api/customers*` (domínio seller) |
| **Persistência** | Supabase service role no backend |
| **LGPD** | Campos sensíveis mascarados na API; valores normalizados nunca expostos |

**Checkpoints de referência (frontend):** `0cf5a05` … `4beea1d` → **4A94** (encerramento S_4).

**Manifesto técnico (fonte de verdade):** `src/constants/customersGlobalBaselineManifest.js`  
**Encerramento do épico:** `docs/dev-center/S_4_EPIC_CLOSURE.md`

---

## 2. Rotas frontend

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/admin/dev-center/customers-global` | `DevCenterCustomersGlobal.jsx` | Listagem + summary + drawer |

**Shell e gate (compartilhados pelo Dev Center):**

| Peça | Arquivo | Função |
|------|---------|--------|
| Gate auth | `DevCenterRoute.jsx` | Bootstrap → `allowed` antes de render |
| Shell admin | `DevCenterShell.jsx` | Sidebar, header, área scrollável |
| Rota App | `App.jsx` | Filha de `DevCenterRoute` + `DevCenterShell` |

**Arquivos principais do módulo:**

```
src/pages/admin/DevCenterCustomersGlobal.jsx
src/pages/admin/devCenterGlobalDetailCache.js
src/pages/admin/devCenterCustomersGlobalInput.js
src/services/devCenterApi.js
src/components/devCenter/ops/*
src/constants/customersDomainBoundary.js
src/constants/customersGlobal*Governance.js
```

---

## 3. Endpoints backend

Base: `/api/dev-center/*` — protegidos por `resolveDevCenterAccess` (ver §5).

| Método | Endpoint | Handler |
|--------|----------|---------|
| `GET` | `/api/dev-center/bootstrap` | Gate inicial (`allowed`, `user_id`) |
| `GET` | `/api/dev-center/customers-global` | Lista + summary |
| `GET` | `/api/dev-center/customers-global/:id` | Detalhe enriquecido (UUID) |

**Arquivos backend:**

```
suse7-backend/src/handlers/devCenter/index.js          — gate + roteamento
suse7-backend/src/handlers/devCenter/devCenterAccess.js
suse7-backend/src/handlers/devCenter/devCenterAdminRoutes.js
suse7-backend/src/handlers/devCenter/devCenterCustomersGlobalDetailService.js
suse7-backend/src/handlers/devCenter/devCenterCustomersGlobalOpsSummaryService.js
suse7-backend/src/handlers/devCenter/devCenterCustomersGlobalInput.js
```

**Query params (list):**

| Param | Regra |
|-------|-------|
| `q` | Opcional; trim, lowercase, max 120 chars; filtro in-memory sobre até 500 rows |

**Path params (detail):**

| Param | Regra |
|-------|-------|
| `:id` | UUID v4; inválido → `404 NOT_FOUND` |

---

## 4. Contratos principais

### 4.1 List — `GET /api/dev-center/customers-global`

```json
{
  "ok": true,
  "customers": [
    {
      "id": "uuid",
      "name": "string | null",
      "document": "••••1234 | null",
      "email": "ab•••c@dominio.com | null",
      "phone": "11••••89 | null",
      "city": null,
      "state": null,
      "total_orders_global": 0,
      "total_spent_global": "0.00",
      "total_sellers_related": 0,
      "last_purchase_global": "ISO8601 | null"
    }
  ],
  "summary": {
    "scope": "admin_global",
    "total_customers": 0,
    "listed_customers": 0,
    "incomplete_contact": 0,
    "ingestion_health": { "...": "..." },
    "data_quality_overview": { "...": "..." }
  }
}
```

- Máximo **200** clientes após filtro `q`.
- `summary.scope` **sempre** `admin_global`.
- Campos `*_normalized`, `dedupe_key` **nunca** aparecem na resposta.

### 4.2 Detail — `GET /api/dev-center/customers-global/:id`

```json
{
  "ok": true,
  "customer": {
    "id": "uuid",
    "name": "string | null",
    "document_masked": "••••1234 | null",
    "email_masked": "... | null",
    "phone_masked": "... | null",
    "total_orders_global": 0,
    "total_spent_global": "0.00",
    "total_sellers_related": 0,
    "first_purchase_global": "ISO8601 | null",
    "last_purchase_global": "ISO8601 | null",
    "related_sellers": [],
    "created_at": "ISO8601 | null",
    "updated_at": "ISO8601 | null"
  },
  "overview": { "...": "..." },
  "activity": {
    "related_sellers_count": 0,
    "active_channels": [],
    "related_sellers": []
  },
  "quality": {
    "status": "not_available",
    "confidence_pct": null,
    "reason": "per_customer_quality_not_computed",
    "scope": "admin_global"
  },
  "ingestion": {
    "status": "not_available",
    "coverage_pct": null,
    "reason": "per_customer_ingestion_not_computed",
    "scope": "admin_global"
  },
  "metadata": {
    "scope": "admin_global",
    "source": "s7_global_customers",
    "contract_version": "S_4.7.1",
    "masked_fields": ["document", "email", "phone"],
    "dedupe_strategy": "document | email | phone | legacy | unknown",
    "record_created_at": "ISO8601 | null",
    "record_updated_at": "ISO8601 | null",
    "sync": {
      "stale": false,
      "stale_reason": null,
      "lag_hours": 0
    }
  }
}
```

**Estabilidade:** contrato congelado desde S_4.7.1 — **proibido breaking change** sem nova fase.

**Domínio seller (referência — não usar no Dev Center):**

| Endpoint | Escopo |
|----------|--------|
| `GET /api/customers` | JWT seller |
| `GET /api/customers/:id` | JWT seller |

Fronteira documentada em `src/constants/customersDomainBoundary.js`.

---

## 5. Segurança / permissões

**Motor:** `resolveDevCenterAccess(supabase, user)`

| Condição | Acesso Dev Center |
|----------|-------------------|
| `profiles.is_admin = true` | ✅ Permitido |
| E-mail em `SUSE7_DEV_CENTER_ALLOWED_EMAILS` | ✅ Permitido |
| Seller sem admin/allowlist | ❌ `403 FORBIDDEN` |
| Sem JWT / token inválido | ❌ `401 UNAUTHORIZED` |

**Frontend:**

1. `DevCenterRoute` chama `GET /api/dev-center/bootstrap`.
2. Se `!allowed` → redirect `/` + `clearDevCenterGlobalDetailCache()`.
3. Se `allowed` → `bindDevCenterGlobalDetailCacheUser(user_id)`.
4. Nenhum fetch de dados antes do gate.

**Mensagens padronizadas:** `DEV_CENTER_AUTH_MESSAGES` em `devCenterAccess.js` — 403 nunca usa “não encontrado”.

**Matriz completa:** `src/constants/customersGlobalPermissionsGovernance.js`

---

## 6. LGPD

| Regra | Implementação |
|-------|----------------|
| Valores normalizados proibidos | `document_normalized`, `email_normalized`, `phone_normalized`, `dedupe_key` nunca na API/UI/cache |
| Lista | Chaves `document`, `email`, `phone` com valor **já mascarado** |
| Detalhe | Chaves `*_masked` |
| Referências externas | Truncadas em `related_sellers.external_customer_id` |
| Cache | Armazena JSON da API (mascarado) — sem localStorage |
| UI | `opsGlobalLgpdPresentation.js` — formatação segura de campos mascarados |

**Inventário de campos:** `src/constants/customersGlobalLgpdGovernance.js`

**Auditoria estática:**

```bash
node scripts/audit_dev_center_customers_global_lgpd.mjs
```

(Executar a partir da raiz do monorepo `ProjetosDev`.)

---

## 7. Cache / stale policy

**Arquivo:** `src/pages/admin/devCenterGlobalDetailCache.js`

| Parâmetro | Valor |
|-----------|-------|
| Escopo | `admin_global` |
| Chave | `admin_global:{userId}:{uuid}` |
| TTL | 90 segundos |
| Max entradas | 8 (FIFO) |
| Persistência | Memória (Map) — **sem localStorage** |
| Bind usuário | Cache limpo ao negar acesso ou trocar `user_id` |

**Política de fetch (drawer):**

| Situação | Comportamento |
|----------|---------------|
| Cache hit (TTL ok, sync ok) | 0 requests — render imediato |
| TTL expirado | Revalidação em background |
| `metadata.sync.stale === true` | Revalidação + label “Pode estar desatualizado” |
| Erro de rede com cache | Fallback cache + aviso |

**Stale heurístico (backend):** lag > 24h entre `updated_at` e `last_purchase_global` → `metadata.sync.stale = true`.

**Helpers UI:** `opsPresentation.js` — `isDetailContractSyncStale`, `formatDetailFreshnessLabel`.

---

## 8. Drawer Global

**Componentes:**

| Peça | Arquivo |
|------|---------|
| Shell | `OpsDrawerShell.jsx` |
| Corpo | `OpsGlobalDrawerBody.jsx` |
| Resumo cliente | `OpsGlobalCustomerSummary.jsx` |
| Contexto ops | `OpsGlobalOperationalContext.jsx` |
| Timeline | `OpsTimeline.jsx` |
| Estilos | `ops.css` |

**Fluxo UX:**

1. Usuário clica **Abrir** na tabela.
2. Page valida UUID (`devCenterCustomersGlobalInput.js`).
3. Resolve cache → hit instantâneo ou `devCenterGetCustomerGlobalDetail(id)`.
4. Drawer exibe blocos: resumo, overview, activity, quality/ingestion (not_available), metadata/sync.
5. Fechar limpa seleção; reabrir dentro do TTL reutiliza cache.

**Empty states:** `OpsEmptyState` + copy em `opsDrawerEmptyCopy.js`.

---

## 9. Scripts de validação

### 9.1 Backend (suite única)

```bash
cd suse7-backend
npm run validate:dev-center-customers-global
```

Expande para:

```bash
npm run test:dev-center-access          # unit — auth
npm run test:dev-center-customers-input # unit — q/id
npm run smoke:dev-center-customers-hardening  # 14 testes
npm run smoke:dev-center-customers-boundary   # 55 testes
```

> Smokes de boundary/hardening exigem API local (ex.: `:3001`) com env configurado.

### 9.2 Auditorias estáticas (monorepo root)

```bash
cd ProjetosDev
node scripts/audit_dev_center_customers_global_lgpd.mjs
node scripts/audit_dev_center_cross_seller_static.mjs
node scripts/audit_dev_center_permissions_static.mjs
```

### 9.3 Frontend build

```bash
cd suse7-frontend
npm run build
```

---

## 10. Checklist de QA manual

Executar em **zoom 100%** (1920px e 1366px mínimo).

### Gate e acesso

- [ ] Usuário allowlist/admin entra em `/admin/dev-center/customers-global`
- [ ] Seller sem permissão é redirecionado para `/` (sem flash de dados)
- [ ] Bootstrap loading exibe spinner neutro

### Listagem

- [ ] Tabela carrega com summary cards (`OpsStatsGrid`)
- [ ] Busca `q` filtra resultados (debounce)
- [ ] Scroll vertical alcança última linha da tabela
- [ ] Scroll horizontal funciona em colunas estreitas
- [ ] Empty state quando filtro sem resultados

### Drawer

- [ ] Abrir drawer — 1 request (cold) ou 0 (cache hit)
- [ ] Campos mascarados visíveis; sem dados normalizados
- [ ] Scroll interno do drawer alcança timeline/ações
- [ ] Fechar e reabrir — cache TTL ok
- [ ] Label freshness / “Pode estar desatualizado” quando sync stale
- [ ] Erro simulado (offline) — fallback cache se existir

### Regressão cross-seller

- [ ] Clientes360 (`/clientes`) continua usando `/api/customers*` apenas
- [ ] Dev Center não chama endpoints seller

---

## 11. Gaps conhecidos

| Severidade | Gap |
|------------|-----|
| **MÉDIA** | Dual-role JWT (seller + allowlist) — política de provisionamento operacional |
| **MÉDIA** | `quality` / `ingestion` por cliente = `not_available` (agregado só no summary) |
| **BAIXA** | Smokes dependem de API local rodando |
| **BAIXA** | Chunk Vite > 500 kB (pré-existente, não específico do módulo) |
| **BAIXA** | Sidebar mobile Dev Center em stack (sem menu hamburger) |

Nenhum gap **bloqueante** para deploy DEV identificado após S_4.9.2A.

---

## 12. Como revalidar antes de deploy

### Sequência mínima (≈ 5 min)

```bash
# 1. Backend — suite automatizada
cd suse7-backend
npm run validate:dev-center-customers-global

# 2. Auditorias estáticas
cd ..
node scripts/audit_dev_center_customers_global_lgpd.mjs
node scripts/audit_dev_center_cross_seller_static.mjs
node scripts/audit_dev_center_permissions_static.mjs

# 3. Frontend build
cd suse7-frontend
npm run build
```

**Critério de go:** todos exit code `0` + QA manual §10 em DEV.

### Variáveis de ambiente relevantes

| Variável | Uso |
|----------|-----|
| `SUSE7_DEV_CENTER_ALLOWED_EMAILS` | Allowlist e-mails Dev Center (backend) |
| Supabase service role | Rotas admin (backend) |
| `VITE_API_URL` / config API | Frontend → backend |

### Pós-deploy smoke rápido

1. Login como admin/allowlist.
2. Abrir `/admin/dev-center/customers-global`.
3. Confirmar summary + ≥1 linha na tabela.
4. Abrir drawer → verificar mascaramento.
5. Logout → tentar URL direta → redirect `/`.

---

## Referências rápidas (código)

| Tópico | Arquivo |
|--------|---------|
| Fronteira domínios | `src/constants/customersDomainBoundary.js` |
| LGPD | `src/constants/customersGlobalLgpdGovernance.js` |
| Cross-seller | `src/constants/customersGlobalCrossSellerGovernance.js` |
| Permissões | `src/constants/customersGlobalPermissionsGovernance.js` |
| Hardening | `src/constants/customersGlobalHardeningGovernance.js` |
| Baseline / inventário | `src/constants/customersGlobalBaselineManifest.js` |

---

*Documento gerado na missão **S_4.9.3**. Não altera contrato, regra de negócio nem LGPD — referência operacional apenas.*
