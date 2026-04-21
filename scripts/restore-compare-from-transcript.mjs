/**
 * Reconstrói um arquivo a partir do transcript (Write + StrReplace em ordem).
 * Uso: node scripts/restore-compare-from-transcript.mjs <basename>
 * Ex.: mercadoLivrePricingScenarioCompareShared.js
 */
import fs from "fs";

const transcriptPath =
  "C:/Users/Desktop/.cursor/projects/c-ProjetosDev/agent-transcripts/a13ffd7f-cbcb-402d-9969-18e002cd228c/a13ffd7f-cbcb-402d-9969-18e002cd228c.jsonl";

const base = process.argv[2];
if (!base) {
  console.error("Usage: node restore-compare-from-transcript.mjs <file-basename>");
  process.exit(1);
}

const outPath = `c:/ProjetosDev/suse7-frontend/src/components/${base}`;
const raw = fs.readFileSync(transcriptPath, "utf8");
const lines = raw.split("\n");

/** @type {string | null} */
let content = null;
let applied = 0;
let skipped = 0;

for (const line of lines) {
  if (!line.includes(base)) continue;
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    continue;
  }
  const parts = o.message?.content;
  if (!Array.isArray(parts)) continue;
  for (const part of parts) {
    if (part?.type !== "tool_use") continue;
    const p = String(part.input?.path || "").replace(/\\/g, "/");
    if (!p.endsWith(`/src/components/${base}`)) continue;

    if (part.name === "Write" && typeof part.input?.contents === "string") {
      content = part.input.contents;
      continue;
    }
    if (part.name === "StrReplace" && content != null) {
      const oldStr = part.input?.old_string;
      const newStr = part.input?.new_string;
      if (typeof oldStr !== "string" || typeof newStr !== "string") continue;
      if (!content.includes(oldStr)) {
        skipped += 1;
        continue;
      }
      content = content.replace(oldStr, newStr);
      applied += 1;
    }
  }
}

if (content == null) {
  console.error("No Write found for", base);
  process.exit(1);
}

fs.writeFileSync(outPath, content, "utf8");
console.log("Wrote", outPath, "len=", content.length, "str_replace=", applied, "skipped=", skipped);
