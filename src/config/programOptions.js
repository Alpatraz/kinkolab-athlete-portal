export const DEFAULT_DISCIPLINES = [
  { id: "karate-combat", labelFr: "Karaté combat", labelEn: "Combat karate" },
  { id: "point-fighting", labelFr: "Point fighting", labelEn: "Point fighting" },
  { id: "light-contact", labelFr: "Light contact", labelEn: "Light contact" },
  { id: "kick-light", labelFr: "Kick light", labelEn: "Kick light" },
  { id: "kata", labelFr: "Kata", labelEn: "Kata" },
  { id: "kobudo", labelFr: "Kobudo", labelEn: "Kobudo" },
  { id: "arts-martiaux", labelFr: "Arts martiaux", labelEn: "Martial arts" },
  { id: "autre", labelFr: "Autre", labelEn: "Other" },
];

export const PROGRAM_ROLES = ["Athlète", "Coach"];

export function normalizeDisciplines(value) {
  if (!Array.isArray(value) || !value.length) return DEFAULT_DISCIPLINES;
  return value
    .map((item, index) => typeof item === "string"
      ? { id: `discipline-${index}`, labelFr: item, labelEn: item }
      : { id: item.id || `discipline-${index}`, labelFr: item.labelFr || "", labelEn: item.labelEn || item.labelFr || "" })
    .filter((item) => item.labelFr.trim());
}
