const deployBackendDev = `cd c:/ProjetosDev/suse7-backend
vercel --prod --yes`;

const disparoManualJobCurl = `curl -X POST "https://suse7-backend-dev.vercel.app/api/jobs/competition-daily-snapshot?limit=25&max_per_run=120" \\
  -H "x-job-secret: SEU_JOB_SECRET_AQUI" \\
  -H "Content-Type: application/json"`;

const powershell3Rodadas = `$ErrorActionPreference = "Stop"

$env:JOB_SECRET = "SEU_JOB_SECRET_AQUI"
$env:BASE_URL = "https://suse7-backend-dev.vercel.app"

powershell -ExecutionPolicy Bypass -File .\\docs\\runbooks\\competition\\competition-daily-snapshot-batch.ps1`;

const sqlAceite = `with janela as (
  select
    ((date_trunc('day', now() at time zone 'America/Sao_Paulo')
      at time zone 'America/Sao_Paulo')) as inicio_utc,
    (((date_trunc('day', now() at time zone 'America/Sao_Paulo') + interval '1 day')
      at time zone 'America/Sao_Paulo')) as fim_utc
),
snap_ult as (
  select distinct on (s.competitor_id)
    s.competitor_id,
    s.captured_at as ultimo_snapshot_captured_at
  from competition_snapshots s
  order by s.competitor_id, s.captured_at desc
),
ativos as (
  select
    c.id,
    greatest(
      coalesce(c.last_captured_at, 'epoch'::timestamptz),
      coalesce(su.ultimo_snapshot_captured_at, 'epoch'::timestamptz)
    ) as ultima_verificacao_efetiva
  from competition_competitors c
  left join snap_ult su on su.competitor_id = c.id
  where c.is_active = true
)
select 'ativos_totais' as metrica, count(*)::bigint as valor from ativos
union all
select 'verificados_hoje_brt', count(*)::bigint
from ativos a, janela j
where a.ultima_verificacao_efetiva >= j.inicio_utc
  and a.ultima_verificacao_efetiva < j.fim_utc
union all
select 'pendentes_hoje_brt', count(*)::bigint
from ativos a, janela j
where a.ultima_verificacao_efetiva < j.inicio_utc
   or a.ultima_verificacao_efetiva is null;`;

const sqlPendentesDetalhado = `-- Arquivo completo no backend:
-- docs/runbooks/competition/competition-daily-snapshot-pending-details.sql
--
-- Retorna pendentes mais antigos com causa_provavel:
-- token invalido/ausente | anuncio removido/404 | 403 ML | timeout | erro interno`;

const sqlResumoPorCausa = `-- Arquivo completo no backend:
-- docs/runbooks/competition/competition-daily-snapshot-pending-summary.sql
--
-- Retorna:
-- causa_provavel | quantidade | percentual_sobre_pendentes
-- exemplos_competitor_listing_id (ate 5) | menor_ultima_verificacao_efetiva`;

const checklistLogs = `[S7_COMPETITION_DAILY_SNAPSHOT] started
[S7_COMPETITION_DAILY_SNAPSHOT] processed
[S7_COMPETITION_DAILY_SNAPSHOT] changed
[S7_COMPETITION_DAILY_SNAPSHOT] unchanged_touched
[S7_COMPETITION_DAILY_SNAPSHOT] errors
[S7_COMPETITION_DAILY_SNAPSHOT] pending_after`;

const criterioAceiteVisual = `1) Executar deploy backend DEV
2) Rodar 3 rodadas manuais do job
3) Confirmar SQL de aceite:
   - ativos_totais = verificados_hoje_brt
   - pendentes_hoje_brt = 0
4) Abrir pagina Concorrencia e validar que concorrentes ativos exibem
   "Ultima atualizacao" de hoje`;

export const operationalDocsCatalog = [
  {
    id: "competition-daily-snapshot",
    category: "Concorrencia",
    title: "Atualizacao diaria de concorrentes",
    description: "Runbook para validar cron, rodar batch manual e diagnosticar pendentes.",
    sections: [
      {
        id: "visao-geral",
        title: "1. Visao geral",
        description:
          "Este runbook cobre deploy DEV, execucao manual em lote, SQL de aceite e diagnostico de pendentes por causa provavel.",
      },
      {
        id: "deploy",
        title: "2. Deploy",
        language: "bash",
        content: deployBackendDev,
      },
      {
        id: "manual-job",
        title: "3. Disparo manual do job",
        language: "bash",
        content: disparoManualJobCurl,
      },
      {
        id: "batch-3-rounds",
        title: "4. PowerShell 3 rodadas",
        language: "powershell",
        content: powershell3Rodadas,
      },
      {
        id: "sql-aceite",
        title: "5. SQL aceite",
        language: "sql",
        content: sqlAceite,
      },
      {
        id: "sql-pendentes-detalhado",
        title: "6. SQL pendentes detalhado",
        language: "sql",
        content: sqlPendentesDetalhado,
      },
      {
        id: "sql-resumo-causa",
        title: "7. SQL resumo por causa",
        language: "sql",
        content: sqlResumoPorCausa,
      },
      {
        id: "checklist-logs",
        title: "8. Checklist de logs",
        language: "text",
        content: checklistLogs,
      },
      {
        id: "criterio-aceite",
        title: "9. Criterio de aceite visual",
        language: "text",
        content: criterioAceiteVisual,
      },
    ],
  },
];
