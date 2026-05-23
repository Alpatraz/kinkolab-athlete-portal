import { gold } from "../utils/format";

export default function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(Number(value || 0), 100));

  return (
    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${safeValue}%`, background: gold }}
      />
    </div>
  );
}
