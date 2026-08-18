import { useMemo, useState } from "react";

function resolveLabel(language) {
  const key = String(language || "").toLowerCase();
  if (key === "bash" || key === "shell") return "bash";
  if (key === "powershell" || key === "ps1") return "powershell";
  if (key === "sql") return "sql";
  if (key === "markdown" || key === "md") return "markdown";
  if (key === "text" || key === "txt") return "texto";
  return key || "texto";
}

export default function CopyableCodeBlock({ content, language = "text" }) {
  const [copied, setCopied] = useState(false);
  const label = useMemo(() => resolveLabel(language), [language]);

  const onCopy = async () => {
    const text = String(content || "");
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="operational-docs__code-wrap">
      <div className="operational-docs__code-head">
        <span className="operational-docs__code-lang">{label}</span>
        <button type="button" className="operational-docs__copy-btn" onClick={onCopy}>
          {copied ? "Copiado com sucesso" : "Copiar"}
        </button>
      </div>
      <pre className="operational-docs__code-pre">
        <code>{content}</code>
      </pre>
    </div>
  );
}
