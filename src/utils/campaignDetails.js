const WKC_SPAIN_2026 = {
  titleEn: "WKC Spain 2026",
  descriptionFr:
    "Campagne de financement destinée aux athlètes qualifiés qui se rendront en Espagne pour les Championnats du monde WKC 2026.",
  descriptionEn:
    "A fundraising campaign supporting qualified athletes travelling to Spain for the 2026 WKC World Championships.",
  startDate: "2026-10-24",
  endDate: "2026-10-30",
  eventStartDate: "2026-10-24",
  eventEndDate: "2026-10-30",
  country: "Espagne",
  countryEn: "Spain",
  city: "Chiclana de la Frontera, Cádiz",
  venueName: "Pabellón Ciudad de Chiclana",
  organizer: "WKC World",
  federation: "World Kickboxing Commission (WKC)",
  disciplinesFr: "Point fighting, combat continu, kata/formes et armes",
  disciplinesEn: "Point fighting, continuous fighting, kata/forms and weapons",
  audienceFr:
    "Athlètes qualifiés et sélectionnés pour représenter leur pays aux Championnats du monde WKC 2026, ainsi que leurs familles, entraîneurs et supporters.",
  audienceEn:
    "Qualified athletes selected to represent their country at the 2026 WKC World Championships, along with their families, coaches and supporters.",
  overviewFr:
    "Les Championnats du monde WKC réunissent des compétiteurs internationaux dans plusieurs disciplines d’arts martiaux. Cette campagne KinkoLab aide les athlètes participants à financer notamment leur inscription, leur déplacement vers l’Espagne, leur hébergement, leur équipement et leur préparation.",
  overviewEn:
    "The WKC World Championships bring together international competitors across several martial arts disciplines. This KinkoLab campaign helps participating athletes fund registration, travel to Spain, accommodation, equipment and preparation.",
  websiteUrl: "https://www.wkcworld.com/world-championships/",
};

function isWkcSpain2026(campaign) {
  const identity = `${campaign?.id || ""} ${campaign?.title || ""}`.toLowerCase();
  return identity.includes("wkc") && identity.includes("spain") && identity.includes("2026");
}

export function withCampaignDefaults(campaign) {
  if (!campaign || !isWkcSpain2026(campaign)) return campaign;

  const populatedCampaign = Object.fromEntries(
    Object.entries(campaign).filter(([, value]) => value !== "" && value != null)
  );

  return { ...WKC_SPAIN_2026, ...populatedCampaign };
}

export function listFromField(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function videoEmbedUrl(value) {
  const safeUrl = safeExternalUrl(value);
  if (!safeUrl) return "";

  const url = new URL(safeUrl);
  if (url.hostname === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
  if (url.hostname.includes("youtube.com")) {
    const id = url.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    if (url.pathname.startsWith("/embed/")) return safeUrl;
  }
  if (url.hostname.includes("vimeo.com")) {
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
  }
  return "";
}
