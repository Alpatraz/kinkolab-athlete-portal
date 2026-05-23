import { cn, gold } from "../utils/format";

export default function StatCard({ icon: Icon, label, value, sub, light = false }) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-lg", light ? "border-zinc-200 bg-white" : "border-zinc-800 bg-zinc-950")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm", light ? "text-zinc-500" : "text-zinc-400")}>{label}</p>
          <p className={cn("mt-1 text-2xl font-bold", light ? "text-zinc-950" : "text-white")}>{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
        </div>
        <div className={cn("rounded-xl p-2", light ? "bg-zinc-100" : "bg-zinc-900")} style={{ color: gold }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
