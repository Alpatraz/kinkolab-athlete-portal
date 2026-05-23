import { gold } from "../utils/format";

export default function MiniSection({ title, icon: Icon, athletes, onOpen, subtitle }) {
  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 text-white">
      <div className="flex items-center gap-2">
        <Icon size={18} style={{ color: gold }} />
        <h3 className="font-black">{title}</h3>
      </div>

      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}

      <div className="mt-4 space-y-2">
        {athletes.slice(0, 4).map((athlete) => (
          <button
            key={`${title}-${athlete.id}`}
            onClick={() => onOpen(athlete.id)}
            className="flex w-full items-center justify-between rounded-2xl bg-black p-3 text-left hover:bg-zinc-900"
          >
            <span>{athlete.avatar} {athlete.name}</span>
            <span className="text-xs text-zinc-500">Voir</span>
          </button>
        ))}
      </div>
    </div>
  );
}
