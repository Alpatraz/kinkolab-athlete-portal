export const gold = "#D7B46A";

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function money(value) {
  return `${Number(value || 0).toLocaleString("fr-CA")} $`;
}

export function totalRaised(athlete) {
  return Number(athlete.raisedShop || 0) + Number(athlete.raisedOffline || 0);
}

export function progressOf(athlete) {
  return Math.round((totalRaised(athlete) / Number(athlete.goal || 1)) * 100);
}

export function campaignTitle(campaigns, id) {
  return campaigns.find((campaign) => campaign.id === id)?.title || "Campagne inconnue";
}
