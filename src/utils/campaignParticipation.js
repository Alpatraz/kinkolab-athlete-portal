const INACTIVE_PARTICIPATION_STATUSES = new Set([
  "archived", "archive", "archivée", "archivé", "paused", "suspendue", "suspendu", "withdrawn", "désinscrit", "désinscrite", "deleted", "supprimé", "supprimée",
]);

export function isActiveParticipation(participation) {
  return Boolean(participation) && !INACTIVE_PARTICIPATION_STATUSES.has(String(participation.status || "active").toLowerCase());
}

export function isActiveCampaign(campaign) {
  return ["active", "actif"].includes(String(campaign?.status || "active").toLowerCase());
}

export function activeCampaignIdForAthlete(athlete, participations = [], campaigns = []) {
  const athleteParticipations = participations.filter((item) => item.athleteId === athlete.id);
  const active = athleteParticipations.find((item) => isActiveParticipation(item) && campaigns.some((campaign) => campaign.id === item.campaignId && isActiveCampaign(campaign)));
  if (active) return active.campaignId;
  if (athleteParticipations.length > 0) return null;
  return campaigns.some((campaign) => campaign.id === athlete.campaignId && isActiveCampaign(campaign)) ? athlete.campaignId : null;
}

export function athleteIsActiveInCampaign(athlete, campaignId, participations = []) {
  const athleteParticipations = participations.filter((item) => item.athleteId === athlete.id);
  if (athleteParticipations.length > 0) return athleteParticipations.some((item) => item.campaignId === campaignId && isActiveParticipation(item));
  return athlete.campaignId === campaignId;
}
