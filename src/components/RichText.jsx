import { Fragment } from "react";

function inlineParts(value) {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g;
  return String(value || "").split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("__") && part.endsWith("__")) return <u key={index}>{part.slice(2, -2)}</u>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function plainRichText(value) {
  return String(value || "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\s+/g, " ").trim();
}

export default function RichText({ value, className = "", paragraphClassName = "" }) {
  const paragraphs = String(value || "").replace(/\r\n/g, "\n").split(/\n\s*\n/).filter((item) => item.trim());
  if (!paragraphs.length) return null;
  return <div className={className}>{paragraphs.map((paragraph, paragraphIndex) => (
    <p key={paragraphIndex} className={paragraphClassName}>
      {paragraph.split("\n").map((line, lineIndex) => <Fragment key={lineIndex}>{lineIndex > 0 && <br />}{inlineParts(line)}</Fragment>)}
    </p>
  ))}</div>;
}
