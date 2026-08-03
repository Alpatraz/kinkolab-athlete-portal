import { useRef } from "react";
import { Bold, Italic, Pilcrow, Underline } from "lucide-react";

export default function RichTextEditor({ value, onChange, placeholder = "", className = "", minHeight = "min-h-32", required = false, lang, dark = false }) {
  const ref = useRef(null);

  function format(before, after = before, fallback = "texte") {
    const field = ref.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function paragraph() {
    const field = ref.current;
    const position = field?.selectionStart ?? value.length;
    const prefix = value.slice(0, position).endsWith("\n\n") || !value ? "" : "\n\n";
    const next = `${value.slice(0, position)}${prefix}${value.slice(position)}`;
    onChange(next);
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(position + prefix.length, position + prefix.length); });
  }

  const buttonClass = `inline-flex h-9 w-9 items-center justify-center rounded-lg border transition hover:border-yellow-600 ${dark ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-300 bg-white text-zinc-700 hover:text-black"}`;
  return <div className={`overflow-hidden rounded-2xl border focus-within:border-yellow-600 ${dark ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-white"} ${className}`}>
    <div className={`flex flex-wrap items-center gap-1 border-b px-3 py-2 ${dark ? "border-zinc-700 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`} aria-label="Outils de mise en forme">
      <button type="button" className={buttonClass} onClick={() => format("**", "**", "texte en gras")} title="Gras"><Bold size={16} /></button>
      <button type="button" className={buttonClass} onClick={() => format("*", "*", "texte en italique")} title="Italique"><Italic size={16} /></button>
      <button type="button" className={buttonClass} onClick={() => format("__", "__", "texte souligné")} title="Souligné"><Underline size={16} /></button>
      <button type="button" className={buttonClass} onClick={paragraph} title="Nouveau paragraphe"><Pilcrow size={16} /></button>
      <span className={`ml-2 text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Sélectionnez du texte, puis choisissez son style.</span>
    </div>
    <textarea ref={ref} required={required} lang={lang} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${minHeight} w-full resize-y px-4 py-4 outline-none ${dark ? "bg-zinc-900 text-white placeholder:text-zinc-500" : "bg-white text-zinc-950"}`} />
  </div>;
}
