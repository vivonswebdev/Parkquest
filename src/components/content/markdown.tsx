import { Fragment, type ReactNode } from "react";

/**
 * Rendu Markdown minimal et SÛR (aucun HTML injecté) : titres ##/###,
 * paragraphes, listes - et 1., citations >, **gras**, *italique*.
 */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
    ) : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? (
      <em key={i}>{p.slice(1, -1)}</em>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return <ul key={bi} className="list-disc space-y-1.5 pl-6">{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*[-*] /, ""))}</li>)}</ul>;
        }
        if (lines.every((l) => /^\s*\d+\. /.test(l))) {
          return <ol key={bi} className="list-decimal space-y-1.5 pl-6">{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+\. /, ""))}</li>)}</ol>;
        }
        if (lines.every((l) => l.startsWith(">"))) {
          return <blockquote key={bi} className="rounded-r-2xl border-l-4 border-primary bg-primary-soft px-4 py-3 text-foreground">{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</blockquote>;
        }
        return (
          <Fragment key={bi}>
            {lines.map((l, i) =>
              l.startsWith("### ") ? <h3 key={i} className="pt-2 text-lg font-bold text-foreground">{inline(l.slice(4))}</h3>
              : l.startsWith("## ") ? <h2 key={i} className="pt-3 text-2xl font-bold text-foreground">{inline(l.slice(3))}</h2>
              : l.trim() ? <p key={i}>{inline(l)}</p> : null,
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
