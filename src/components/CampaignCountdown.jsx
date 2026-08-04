import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { gold } from "../utils/format";
import { useLanguage } from "../context/LanguageContext";

function remaining(endDate) {
  if (!endDate) return null;
  const end = new Date(`${String(endDate).slice(0, 10)}T23:59:59`);
  const milliseconds = end.getTime() - Date.now();
  if (Number.isNaN(end.getTime())) return null;
  if (milliseconds <= 0) return { ended: true };
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.max(1, Math.floor((milliseconds % 3_600_000) / 60_000));
  return hours < 24 ? { hours, minutes } : { days: Math.ceil(milliseconds / 86_400_000) };
}

export default function CampaignCountdown({ endDate, className = "" }) {
  const { language } = useLanguage();
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => refresh((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const value = remaining(endDate);
  if (!value) return null;
  const label = value.ended
    ? (language === "en" ? "Campaign ended" : "Campagne terminée")
    : value.days
      ? (language === "en" ? `${value.days} day${value.days > 1 ? "s" : ""} remaining` : `${value.days} jour${value.days > 1 ? "s" : ""} restant${value.days > 1 ? "s" : ""}`)
      : (language === "en" ? `${value.hours} h ${value.minutes} min remaining` : `${value.hours} h ${value.minutes} min restantes`);
  return <div className={`inline-flex items-center gap-2 rounded-full border border-yellow-700/50 bg-yellow-500/10 px-3 py-2 text-xs font-black uppercase ${className}`} style={{ color: gold }}><Clock3 size={15} />{label}</div>;
}
