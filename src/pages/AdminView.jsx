import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Archive,
  Ban,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Eye,
  FolderKanban,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Mail,
  Megaphone,
  Monitor,
  PackagePlus,
  Palette,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Send,
  Shield,
  Smartphone,
  Trash2,
  Upload,
  UserPlus2,
  Users,
  XCircle,
} from "lucide-react";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { auth, db, storage } from "../firebase";

import {
  campaignTitle,
  gold,
  money,
  progressOf,
} from "../utils/format";

import StatCard from "../components/StatCard";

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFileName(fileName) {
  return String(fileName || "image")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
}

async function uploadAdminImage(file, pathPrefix) {
  if (!file) return "";

  const path = `${pathPrefix}/${Date.now()}-${safeFileName(file.name)}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

function StatusPill({ status }) {
  const colors = {
    actif: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accepté: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    suspendu: "bg-amber-50 text-amber-700 border-amber-200",
    suspendue: "bg-amber-50 text-amber-700 border-amber-200",
    terminee: "bg-blue-50 text-blue-700 border-blue-200",
    archivé: "bg-zinc-100 text-zinc-700 border-zinc-300",
    archivée: "bg-zinc-100 text-zinc-700 border-zinc-300",
    en_attente: "bg-amber-50 text-amber-700 border-amber-200",
    refusé: "bg-red-50 text-red-700 border-red-200",
    reserved: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    versé: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    opened: "bg-blue-50 text-blue-700 border-blue-200",
    clicked: "bg-violet-50 text-violet-700 border-violet-200",
    bounced: "bg-red-50 text-red-700 border-red-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    complained: "bg-red-50 text-red-700 border-red-200",
    suppressed: "bg-zinc-100 text-zinc-700 border-zinc-300",
    delivery_delayed: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    annulé: "bg-red-50 text-red-700 border-red-200",
    refunded: "bg-zinc-100 text-zinc-700 border-zinc-300",
    remboursé: "bg-zinc-100 text-zinc-700 border-zinc-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${
        colors[status] || colors.en_attente
      }`}
    >
      {status || "en_attente"}
    </span>
  );
}

function AdminButton({ children, onClick, variant = "dark", disabled = false }) {
  const styles = {
    dark: "bg-black text-white",
    green: "bg-emerald-600 text-white",
    red: "bg-red-600 text-white",
    amber: "bg-amber-500 text-black",
    light: "bg-white text-zinc-950 border border-zinc-300",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function AdminField({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder = "", type = "text", hint = "" }) {
  return (
    <AdminField label={label} hint={hint}>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-200 p-3 text-zinc-950"
      />
    </AdminField>
  );
}

function TextAreaInput({ label, value, onChange, placeholder = "", hint = "" }) {
  return (
    <AdminField label={label} hint={hint}>
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 w-full rounded-2xl border border-zinc-200 p-3 text-zinc-950"
      />
    </AdminField>
  );
}

function SelectInput({ label, value, onChange, children }) {
  return (
    <AdminField label={label}>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950"
      >
        {children}
      </select>
    </AdminField>
  );
}

const defaultEmailDesign = {
  backgroundColor: "#090909",
  cardColor: "#18181b",
  textColor: "#d4d4d8",
  headingColor: "#f4f4f5",
  accentColor: "#d7b85b",
  buttonTextColor: "#000000",
  logoUrl: "https://athletes.kinkolab.com/images/kinko-logo.png",
  heroImageUrl: "",
  borderRadius: 24,
  contentWidth: 640,
  alignment: "left",
  blocks: ["logo", "image", "title", "body", "button"],
};

const emailBlockLabels = {
  logo: "Logo",
  image: "Image principale",
  title: "Titre",
  body: "Texte",
  button: "Bouton",
};

const workflowOptions = [
  { key: "application_received", label: "Candidature reçue", trigger: "Après l’envoi du formulaire d’inscription" },
  { key: "application_accepted", label: "Candidature acceptée", trigger: "Quand un administrateur accepte une candidature" },
  { key: "application_refused", label: "Candidature refusée", trigger: "Quand un administrateur refuse une candidature" },
  { key: "payout_paid", label: "Versement effectué", trigger: "Quand un administrateur enregistre un versement" },
];

function previewVariables(value = "") {
  return String(value)
    .replaceAll("{{name}}", "Alex Tremblay")
    .replaceAll("{{campaign}}", "Championnat mondial 2026")
    .replaceAll("{{amount}}", "125,00 $")
    .replaceAll("{{loginUrl}}", "https://athletes.kinkolab.com/login");
}

function EmailPreview({ template, language = "fr", mobile = false }) {
  const content = template?.[language] || template?.fr || {};
  const design = { ...defaultEmailDesign, ...(template?.design || {}) };
  const blocks = {
    logo: design.logoUrl ? <img src={design.logoUrl} alt="KinkoLab" className="max-h-16 max-w-[150px] object-contain" /> : null,
    image: design.heroImageUrl ? <img src={design.heroImageUrl} alt="Aperçu" className="max-h-64 w-full object-cover" style={{ borderRadius: Math.max(0, Number(design.borderRadius) - 8) }} /> : null,
    title: <h3 className="text-3xl font-black leading-tight" style={{ color: design.headingColor }}>{previewVariables(content.title || "Titre du courriel")}</h3>,
    body: <div className="whitespace-pre-line text-base leading-7" style={{ color: design.textColor }}>{previewVariables(content.body || "Contenu du courriel")}</div>,
    button: content.buttonLabel ? <a href={previewVariables(content.buttonUrl || "#")} onClick={(event) => event.preventDefault()} className="inline-block px-5 py-3 font-black no-underline" style={{ backgroundColor: design.accentColor, color: design.buttonTextColor, borderRadius: 12 }}>{previewVariables(content.buttonLabel)}</a> : null,
  };
  return (
    <div className="mx-auto overflow-hidden shadow-2xl transition-all" style={{ width: mobile ? 375 : "100%", maxWidth: design.contentWidth, backgroundColor: design.backgroundColor, padding: mobile ? 16 : 28 }}>
      <div style={{ backgroundColor: design.cardColor, borderRadius: Number(design.borderRadius), border: `1px solid ${design.accentColor}55`, padding: mobile ? 20 : 32, textAlign: design.alignment }}>
        <div className="space-y-6">{(design.blocks || defaultEmailDesign.blocks).map((key) => <div key={key}>{blocks[key]}</div>)}</div>
        <p className="mt-8 border-t pt-5 text-xs opacity-60" style={{ color: design.textColor, borderColor: `${design.accentColor}55` }}>KinkoLab Inc. · Terrebonne, Québec · athletes@kinkolab.com</p>
      </div>
    </div>
  );
}

function emptyProduct() {
  return {
    title: "",
    price: "",
    reservedAmount: "20",
    imageUrl: "",
    shopifyUrl: "",
    description: "",
  };
}

const emptyCampaign = {
  title: "",
  titleEn: "",
  year: "2026",
  type: "event",
  status: "active",
  country: "",
  city: "",
  startDate: "",
  endDate: "",
  eventDate: "",
  eventStartDate: "",
  eventEndDate: "",
  goal: "",
  shopifyUrl: "",
  sponsorUrl: "",
  collectionHandle: "",
  collectionUrl: "",
  shopifyCollectionUrl: "",
  bannerImageUrl: "",
  venueName: "",
  organizer: "",
  federation: "",
  disciplinesFr: "",
  disciplinesEn: "",
  audienceFr: "",
  audienceEn: "",
  overviewFr: "",
  overviewEn: "",
  websiteUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  videoUrl: "",
  galleryImageUrls: "",
  products: [],
  description: "",
  descriptionEn: "",
};

function ProductEditor({ campaignState, setCampaignState, onUploadProductImage }) {
  const products = Array.isArray(campaignState.products) ? campaignState.products : [];

  function updateProduct(index, field, value) {
    const nextProducts = [...products];
    nextProducts[index] = {
      ...nextProducts[index],
      [field]: value,
    };

    setCampaignState({ ...campaignState, products: nextProducts });
  }

  function addProduct() {
    setCampaignState({
      ...campaignState,
      products: [...products, emptyProduct()],
    });
  }

  function removeProduct(index) {
    const nextProducts = products.filter((_, itemIndex) => itemIndex !== index);
    setCampaignState({ ...campaignState, products: nextProducts });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-zinc-700">Produits de la campagne</p>
          <p className="mt-1 text-xs text-zinc-500">
            Ces produits s’affichent dans la section “Produits de la campagne”.
          </p>
        </div>

        <AdminButton variant="light" onClick={addProduct}>
          <PackagePlus size={16} /> Ajouter un produit
        </AdminButton>
      </div>

      {products.length === 0 && (
        <p className="mt-4 rounded-xl bg-white p-4 text-sm text-zinc-500">
          Aucun produit ajouté pour cette campagne.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {products.map((product, index) => (
          <div key={index} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-black text-zinc-950">Produit #{index + 1}</p>
              <AdminButton variant="red" onClick={() => removeProduct(index)}>
                <Trash2 size={15} /> Retirer
              </AdminButton>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextInput
                label="Nom du produit"
                value={product.title}
                onChange={(value) => updateProduct(index, "title", value)}
                placeholder="Ex. Hoodie Supporter Team Canada"
              />

              <TextInput
                label="Prix affiché"
                type="number"
                value={product.price}
                onChange={(value) => updateProduct(index, "price", value)}
                placeholder="Ex. 65"
              />

              <TextInput
                label="Montant remis"
                type="number"
                value={product.reservedAmount}
                onChange={(value) => updateProduct(index, "reservedAmount", value)}
                placeholder="Ex. 20"
                hint="Montant remis à l’athlète ou à la famille sélectionné(e)."
              />

              <TextInput
                label="Lien Shopify du produit"
                value={product.shopifyUrl}
                onChange={(value) => updateProduct(index, "shopifyUrl", value)}
                placeholder="https://kinkolab.com/products/..."
              />
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <TextInput
                label="URL image produit"
                value={product.imageUrl}
                onChange={(value) => updateProduct(index, "imageUrl", value)}
                placeholder="https://firebasestorage.googleapis.com/..."
              />

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-black text-white">
                <Upload size={16} /> Uploader
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onUploadProductImage(index, event.target.files?.[0])}
                />
              </label>
            </div>

            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title || "Produit"}
                className="mt-3 h-40 w-full rounded-2xl object-cover"
              />
            )}

            <div className="mt-3">
              <TextAreaInput
                label="Description courte"
                value={product.description}
                onChange={(value) => updateProduct(index, "description", value)}
                placeholder="Courte description affichée sur la page campagne."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminView({
  athletes = [],
  campaigns = [],
  wallMessages = [],
  setWallMessages,
  goBack,
  onOpenAthlete,
}) {
  async function sendProgramNotification(type, recordId) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Session administrateur expirée.");
    const response = await fetch("/api/program-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, recordId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible d’envoyer le courriel.");
    return data;
  }
  const [activeTab, setActiveTab] = useState("candidatures");
  const [applications, setApplications] = useState([]);
  const [families, setFamilies] = useState([]);
  const [firestoreCampaigns, setFirestoreCampaigns] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [editingEmailTemplate, setEditingEmailTemplate] = useState(null);
  const [selectedEmailTemplateKey, setSelectedEmailTemplateKey] = useState("");
  const [emailCenterLoading, setEmailCenterLoading] = useState(false);
  const [emailActionLoading, setEmailActionLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testLanguage, setTestLanguage] = useState("fr");
  const [previewLanguage, setPreviewLanguage] = useState("fr");
  const [previewMobile, setPreviewMobile] = useState(false);
  const [draggedEmailBlock, setDraggedEmailBlock] = useState("");
  const [adminUsers, setAdminUsers] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", language: "fr" });
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [acceptedAccess, setAcceptedAccess] = useState(null);

  const [newCampaign, setNewCampaign] = useState(emptyCampaign);
  const [editingCampaignId, setEditingCampaignId] = useState("");
  const [editingCampaign, setEditingCampaign] = useState(emptyCampaign);

  const [newFamily, setNewFamily] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
  });

  const [newParticipation, setNewParticipation] = useState({
    athleteId: "",
    campaignId: "",
    fundingMode: "individual",
    goal: "",
  });

  const [newPayout, setNewPayout] = useState({
    targetKey: "",
    amount: "",
    method: "virement",
    note: "",
  });

  useEffect(() => {
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setApplications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubFamilies = onSnapshot(collection(db, "families"), (snapshot) => {
      setFamilies(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCampaigns = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      setFirestoreCampaigns(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubParticipations = onSnapshot(
      collection(db, "campaignParticipations"),
      (snapshot) => {
        setParticipations(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubContributions = onSnapshot(
      query(collection(db, "contributions"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setContributions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubPayouts = onSnapshot(
      query(collection(db, "payouts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setPayouts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    return () => {
      unsubApps();
      unsubFamilies();
      unsubCampaigns();
      unsubParticipations();
      unsubContributions();
      unsubPayouts();
    };
  }, []);

  const allCampaigns = useMemo(() => {
    const map = new Map();
    campaigns.forEach((campaign) => map.set(campaign.id, campaign));
    firestoreCampaigns.forEach((campaign) => map.set(campaign.id, campaign));
    return Array.from(map.values());
  }, [campaigns, firestoreCampaigns]);

  const pendingApplications = applications.filter(
    (application) => (application.status || "en_attente") === "en_attente"
  );

  const pendingMessages = wallMessages.filter(
    (message) => message.status === "en_attente"
  );

  const athletesWithoutFamily = athletes.filter((athlete) => !athlete.familyId);

  function isFinanciallyActive(contribution) {
    const status = String(contribution?.status || "reserved").toLowerCase();
    return !["cancelled", "annulé", "refunded", "remboursé"].includes(status);
  }

  function isCancelledContribution(contribution) {
    const status = String(contribution?.status || "").toLowerCase();
    return status === "cancelled" || status === "annulé";
  }

  function isRefundedContribution(contribution) {
    const status = String(contribution?.status || "").toLowerCase();
    return status === "refunded" || status === "remboursé";
  }

  function contributionAmount(contribution) {
    return Number(contribution.amountReserved || contribution.reservedAmount || 0);
  }

  function contributionDate(contribution) {
    if (contribution.createdAt?.toDate) {
      return contribution.createdAt.toDate().toLocaleDateString("fr-CA");
    }

    return contribution.displayDate || contribution.orderCreatedAt || "—";
  }

  function payoutAmount(payout) {
    return Number(payout.amount || 0);
  }

  function payoutDate(payout) {
    if (payout.createdAt?.toDate) {
      return payout.createdAt.toDate().toLocaleDateString("fr-CA");
    }

    return payout.date || "—";
  }

  function participationAthleteName(id) {
    return athletes.find((a) => a.id === id)?.name || id;
  }

  function participationCampaignName(id) {
    return allCampaigns.find((c) => c.id === id)?.title || id;
  }

  const financialSummary = useMemo(() => {
    const activeContributions = contributions.filter(isFinanciallyActive);
    const cancelledContributions = contributions.filter(isCancelledContribution);
    const refundedContributions = contributions.filter(isRefundedContribution);

    const reserved = activeContributions.reduce(
      (sum, contribution) => sum + contributionAmount(contribution),
      0
    );

    const cancelled = cancelledContributions.reduce(
      (sum, contribution) => sum + contributionAmount(contribution),
      0
    );

    const refunded = refundedContributions.reduce(
      (sum, contribution) => sum + contributionAmount(contribution),
      0
    );

    const paid = payouts
      .filter((payout) => (payout.status || "paid") === "paid")
      .reduce((sum, payout) => sum + payoutAmount(payout), 0);

    return {
      reserved,
      cancelled,
      refunded,
      paid,
      balance: Math.max(reserved - paid, 0),
      count: activeContributions.length,
      cancelledCount: cancelledContributions.length,
      refundedCount: refundedContributions.length,
      payoutCount: payouts.length,
    };
  }, [contributions, payouts]);

  const financeRows = useMemo(() => {
    const rows = new Map();

    contributions.filter(isFinanciallyActive).forEach((contribution) => {
      const key =
        contribution.fundingMode === "family"
          ? `family-${contribution.fundingGroupId || contribution.familyId}`
          : `athlete-${contribution.athleteId || contribution.supportLabel}`;

      if (!rows.has(key)) {
        rows.set(key, {
          id: key,
          label:
            contribution.fundingMode === "family"
              ? contribution.supportLabel ||
                contribution.familyName ||
                `Famille ${contribution.familyId || ""}`
              : contribution.athleteName ||
                contribution.supportLabel ||
                contribution.athleteId ||
                "Athlète",
          type: contribution.fundingMode === "family" ? "Famille" : "Athlète",
          athleteId: contribution.athleteId || null,
          familyId: contribution.familyId || null,
          fundingGroupId: contribution.fundingGroupId || null,
          campaignId: contribution.campaignId || "",
          campaignTitle:
            contribution.campaignTitle ||
            participationCampaignName(contribution.campaignId),
          reserved: 0,
          paid: 0,
          count: 0,
        });
      }

      const row = rows.get(key);
      row.reserved += contributionAmount(contribution);
      row.count += 1;
    });

    payouts.forEach((payout) => {
      const targetKey = payout.targetKey;
      if (!targetKey) return;

      if (!rows.has(targetKey)) {
        rows.set(targetKey, {
          id: targetKey,
          label: payout.beneficiaryLabel || "Bénéficiaire",
          type: payout.beneficiaryType || "—",
          athleteId: payout.athleteId || null,
          familyId: payout.familyId || null,
          fundingGroupId: payout.fundingGroupId || null,
          campaignId: payout.campaignId || "",
          campaignTitle: payout.campaignTitle || participationCampaignName(payout.campaignId),
          reserved: 0,
          paid: 0,
          count: 0,
        });
      }

      if ((payout.status || "paid") === "paid") {
        rows.get(targetKey).paid += payoutAmount(payout);
      }
    });

    return Array.from(rows.values()).map((row) => ({
      ...row,
      balance: Math.max(row.reserved - row.paid, 0),
    }));
  }, [contributions, payouts, allCampaigns]);

  const tabs = [
    ["candidatures", "Candidatures"],
    ["athletes", "Athlètes"],
    ["families", "Familles"],
    ["campaigns", "Campagnes"],
    ["participations", "Participations"],
    ["finances", "Finances"],
    ["communications", "Communications"],
    ["administrateurs", "Administrateurs"],
    ["messages", "Messages"],
  ];

  async function emailCenterRequest(options = {}) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Session administrateur expirée.");
    const response = await fetch("/api/program-notification", {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de communiquer avec le centre de courriels.");
    return data;
  }

  async function loadEmailCenter() {
    setEmailCenterLoading(true);
    try {
      const data = await emailCenterRequest();
      const templates = data.templates || [];
      setEmailTemplates(templates);
      setEmailLogs(data.logs || []);
      if (templates.length) {
        const selected = templates.find((template) => template.key === selectedEmailTemplateKey) || templates[0];
        selectEmailTemplate(selected);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setEmailCenterLoading(false);
    }
  }

  function selectEmailTemplate(template) {
    if (!template) return;
    setSelectedEmailTemplateKey(template.key);
    setEditingEmailTemplate(JSON.parse(JSON.stringify(template)));
  }

  useEffect(() => {
    if (activeTab === "communications" && emailTemplates.length === 0) loadEmailCenter();
  }, [activeTab]);

  async function adminUsersRequest(options = {}) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Session administrateur expirée.");
    const response = await fetch("/api/admin-users", { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de gérer les administrateurs.");
    return data;
  }

  async function loadAdminUsers() {
    setAdminUsersLoading(true);
    try { const data = await adminUsersRequest(); setAdminUsers(data.admins || []); }
    catch (error) { alert(error.message); }
    finally { setAdminUsersLoading(false); }
  }

  useEffect(() => {
    if (activeTab === "administrateurs" && adminUsers.length === 0) loadAdminUsers();
  }, [activeTab]);

  async function inviteAdmin() {
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) { alert("Le nom et le courriel sont obligatoires."); return; }
    setAdminUsersLoading(true);
    try {
      await adminUsersRequest({ method: "POST", body: JSON.stringify(newAdmin) });
      setNewAdmin({ name: "", email: "", language: "fr" });
      await loadAdminUsers();
      alert("Administrateur créé et invitation envoyée.");
    } catch (error) { alert(error.message); }
    finally { setAdminUsersLoading(false); }
  }

  async function saveEmailTemplate() {
    if (!editingEmailTemplate) return;
    setEmailActionLoading(true);
    try {
      await emailCenterRequest({ method: "POST", body: JSON.stringify({ action: "save_template", template: editingEmailTemplate }) });
      await loadEmailCenter();
      alert("Modèle enregistré.");
    } catch (error) {
      alert(error.message);
    } finally {
      setEmailActionLoading(false);
    }
  }

  async function sendTestEmail() {
    if (!editingEmailTemplate || !testEmail.trim()) {
      alert("Entre l’adresse qui doit recevoir le courriel test.");
      return;
    }
    setEmailActionLoading(true);
    try {
      await emailCenterRequest({ method: "POST", body: JSON.stringify({ action: "test_template", template: editingEmailTemplate, email: testEmail.trim(), language: testLanguage }) });
      await loadEmailCenter();
      alert("Courriel test envoyé.");
    } catch (error) {
      alert(error.message);
    } finally {
      setEmailActionLoading(false);
    }
  }

  function createEmailTemplate() {
    const key = `custom_${Date.now()}`;
    const template = {
      key,
      name: "Nouveau modèle",
      trigger: "Envoi manuel",
      enabled: false,
      design: { ...defaultEmailDesign },
      fr: { subject: "", title: "", body: "Bonjour {{name}},\n\n", buttonLabel: "", buttonUrl: "" },
      en: { subject: "", title: "", body: "Hello {{name}},\n\n", buttonLabel: "", buttonUrl: "" },
    };
    setSelectedEmailTemplateKey(key);
    setEditingEmailTemplate(template);
  }

  function updateEmailContent(language, field, value) {
    setEditingEmailTemplate({
      ...editingEmailTemplate,
      [language]: { ...(editingEmailTemplate?.[language] || {}), [field]: value },
    });
  }

  function updateEmailDesign(field, value) {
    setEditingEmailTemplate({
      ...editingEmailTemplate,
      design: { ...defaultEmailDesign, ...(editingEmailTemplate?.design || {}), [field]: value },
    });
  }

  function moveEmailBlock(targetBlock) {
    if (!draggedEmailBlock || draggedEmailBlock === targetBlock) return;
    const current = [...(editingEmailTemplate?.design?.blocks || defaultEmailDesign.blocks)];
    const from = current.indexOf(draggedEmailBlock);
    const to = current.indexOf(targetBlock);
    if (from < 0 || to < 0) return;
    current.splice(from, 1);
    current.splice(to, 0, draggedEmailBlock);
    updateEmailDesign("blocks", current);
    setDraggedEmailBlock("");
  }

  async function updateApplicationCampaign(applicationId, campaignId) {
    const campaign = allCampaigns.find((item) => item.id === campaignId);

    await updateDoc(doc(db, "applications", applicationId), {
      campaignId,
      campaignTitle: campaign?.title || "",
      updatedAt: serverTimestamp(),
    });
  }

  async function acceptApplication(application) {
    setActionLoadingId(application.id);
    setAcceptedAccess(null);

    try {
      const response = await fetch("/.netlify/functions/accept-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l’acceptation.");
      }

      setAcceptedAccess({
        athleteId: data.athleteId,
        email: data.email,
      });
      sendProgramNotification("application_accepted", application.id).catch((error) =>
        alert(`Candidature acceptée, mais le courriel n’a pas été envoyé : ${error.message}`)
      );
    } catch (error) {
      alert(error.message || "Erreur lors de l’acceptation.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function refuseApplication(application) {
    setActionLoadingId(application.id);

    try {
      await updateDoc(doc(db, "applications", application.id), {
        status: "refusé",
        refusedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      sendProgramNotification("application_refused", application.id).catch((error) =>
        alert(`Candidature refusée, mais le courriel n’a pas été envoyé : ${error.message}`)
      );
    } catch {
      alert("Erreur lors du refus.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function updateAthleteStatus(athlete, status) {
    try {
      await updateDoc(doc(db, "athletes", athlete.id), {
        status,
        isPublic: status !== "suspendu" && status !== "archivé",
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible de modifier cet athlète.");
    }
  }

  function normalizedCampaignPayload(campaignState, campaignId) {
    const collectionUrl =
      campaignState.shopifyCollectionUrl || campaignState.collectionUrl || "";

    return {
      ...campaignState,
      id: campaignId,
      goal: Number(campaignState.goal || 0),
      collectionUrl,
      shopifyCollectionUrl: collectionUrl,
      products: Array.isArray(campaignState.products) ? campaignState.products : [],
      updatedAt: serverTimestamp(),
    };
  }

  async function createCampaign() {
    if (!newCampaign.title.trim()) {
      alert("Le titre de la campagne est obligatoire.");
      return;
    }

    const campaignId = slugify(`${newCampaign.title}-${newCampaign.year}`);

    await setDoc(
      doc(db, "campaigns", campaignId),
      {
        ...normalizedCampaignPayload(newCampaign, campaignId),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    setNewCampaign(emptyCampaign);
  }

  function startEditCampaign(campaign) {
    setEditingCampaignId(campaign.id);
    setEditingCampaign({
      ...emptyCampaign,
      title: campaign.title || "",
      titleEn: campaign.titleEn || "",
      year: campaign.year || "2026",
      type: campaign.type || "event",
      status: campaign.status || "active",
      country: campaign.country || "",
      city: campaign.city || "",
      startDate: campaign.startDate || "",
      endDate: campaign.endDate || "",
      eventDate: campaign.eventDate || "",
      eventStartDate: campaign.eventStartDate || campaign.eventDate || "",
      eventEndDate: campaign.eventEndDate || "",
      goal: campaign.goal || "",
      shopifyUrl: campaign.shopifyUrl || "",
      sponsorUrl: campaign.sponsorUrl || "",
      collectionHandle: campaign.collectionHandle || "",
      collectionUrl: campaign.collectionUrl || campaign.shopifyCollectionUrl || "",
      shopifyCollectionUrl: campaign.shopifyCollectionUrl || campaign.collectionUrl || "",
      bannerImageUrl: campaign.bannerImageUrl || "",
      venueName: campaign.venueName || "",
      organizer: campaign.organizer || "",
      federation: campaign.federation || "",
      disciplinesFr: campaign.disciplinesFr || campaign.disciplines || "",
      disciplinesEn: campaign.disciplinesEn || "",
      audienceFr: campaign.audienceFr || campaign.audience || "",
      audienceEn: campaign.audienceEn || "",
      overviewFr: campaign.overviewFr || campaign.overview || "",
      overviewEn: campaign.overviewEn || "",
      websiteUrl: campaign.websiteUrl || "",
      facebookUrl: campaign.facebookUrl || "",
      instagramUrl: campaign.instagramUrl || "",
      youtubeUrl: campaign.youtubeUrl || "",
      videoUrl: campaign.videoUrl || "",
      galleryImageUrls: Array.isArray(campaign.galleryImageUrls)
        ? campaign.galleryImageUrls.join("\n")
        : campaign.galleryImageUrls || "",
      products: Array.isArray(campaign.products) ? campaign.products : [],
      description: campaign.description || "",
      descriptionEn: campaign.descriptionEn || "",
    });
  }

  async function saveEditedCampaign() {
    if (!editingCampaignId) return;

    try {
      await setDoc(
        doc(db, "campaigns", editingCampaignId),
        normalizedCampaignPayload(editingCampaign, editingCampaignId),
        { merge: true }
      );

      setEditingCampaignId("");
      setEditingCampaign(emptyCampaign);
    } catch {
      alert("Impossible de modifier cette campagne.");
    }
  }

  async function updateCampaignStatus(campaign, status) {
    try {
      await setDoc(
        doc(db, "campaigns", campaign.id),
        {
          ...campaign,
          status,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      alert("Impossible de modifier cette campagne.");
    }
  }

  async function uploadCampaignBanner(campaignState, setCampaignState, file) {
    if (!file) return;

    try {
      const baseSlug = slugify(campaignState.title || "campaign");
      const url = await uploadAdminImage(file, `campaign-banners/${baseSlug}`);
      setCampaignState({ ...campaignState, bannerImageUrl: url });
    } catch (error) {
      console.error("Erreur upload bannière campagne:", error);
      alert("Impossible de téléverser la bannière.");
    }
  }

  async function uploadCampaignProductImage(campaignState, setCampaignState, index, file) {
    if (!file) return;

    try {
      const baseSlug = slugify(campaignState.title || "campaign");
      const url = await uploadAdminImage(file, `campaign-products/${baseSlug}`);
      const products = Array.isArray(campaignState.products)
        ? [...campaignState.products]
        : [];

      products[index] = {
        ...(products[index] || emptyProduct()),
        imageUrl: url,
      };

      setCampaignState({ ...campaignState, products });
    } catch (error) {
      console.error("Erreur upload image produit:", error);
      alert("Impossible de téléverser l’image du produit.");
    }
  }

  async function createFamily() {
    if (!newFamily.name.trim() || !newFamily.contactEmail.trim()) {
      alert("Nom de famille et courriel principal obligatoires.");
      return;
    }

    const familyId = slugify(newFamily.name);

    await setDoc(
      doc(db, "families", familyId),
      {
        id: familyId,
        name: newFamily.name,
        contactEmail: newFamily.contactEmail,
        contactName: newFamily.contactName,
        athleteIds: [],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setNewFamily({ name: "", contactName: "", contactEmail: "" });
  }

  async function addAthleteToFamily(athlete, family) {
    try {
      await updateDoc(doc(db, "athletes", athlete.id), {
        familyId: family.id,
        familyName: family.name,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "families", family.id), {
        athleteIds: arrayUnion(athlete.id),
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible d’ajouter l’athlète à cette famille.");
    }
  }

  async function removeAthleteFromFamily(athlete, family) {
    try {
      await updateDoc(doc(db, "athletes", athlete.id), {
        familyId: null,
        familyName: null,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "families", family.id), {
        athleteIds: arrayRemove(athlete.id),
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible de retirer l’athlète de cette famille.");
    }
  }

  async function createParticipation() {
    if (!newParticipation.athleteId || !newParticipation.campaignId) {
      alert("Athlète et campagne obligatoires.");
      return;
    }

    const athlete = athletes.find((a) => a.id === newParticipation.athleteId);
    const campaign = allCampaigns.find((c) => c.id === newParticipation.campaignId);

    if (!athlete || !campaign) {
      alert("Athlète ou campagne introuvable.");
      return;
    }

    let fundingGroupId = "";

    if (newParticipation.fundingMode === "family") {
      if (!athlete.familyId) {
        alert("Cet athlète n’appartient à aucune famille.");
        return;
      }

      fundingGroupId = `${athlete.familyId}-${campaign.id}`;
    } else {
      fundingGroupId = `${athlete.id}-${campaign.id}`;
    }

    const participationId = slugify(
      `${athlete.id}-${campaign.id}-${newParticipation.fundingMode}`
    );

    await setDoc(
      doc(db, "campaignParticipations", participationId),
      {
        athleteId: athlete.id,
        athleteName: athlete.name,
        familyId: athlete.familyId || null,
        familyName: athlete.familyName || null,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        fundingMode: newParticipation.fundingMode,
        fundingGroupId,
        goal: Number(newParticipation.goal || 0),
        raisedShop: 0,
        raisedOffline: 0,
        raisedSponsorship: 0,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setNewParticipation({
      athleteId: "",
      campaignId: "",
      fundingMode: "individual",
      goal: "",
    });

    alert("Participation créée.");
  }

  async function updateParticipationStatus(participation, status) {
    try {
      await updateDoc(doc(db, "campaignParticipations", participation.id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible de modifier cette participation.");
    }
  }

  async function deleteParticipation(participation) {
    const confirmed = window.confirm(
      `Supprimer la participation de ${
        participation.athleteName || participation.athleteId
      } à ${participation.campaignTitle || participation.campaignId} ?`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "campaignParticipations", participation.id));
    } catch {
      alert("Impossible de supprimer cette participation.");
    }
  }

  async function updateContributionStatus(contribution, status) {
    const statusLabels = {
      reserved: "réactiver",
      cancelled: "annuler",
      refunded: "marquer comme remboursée",
    };

    const confirmed = window.confirm(
      `Confirmer : ${statusLabels[status] || status} la contribution ${
        contribution.orderName || contribution.orderId || "sélectionnée"
      } ?`
    );

    if (!confirmed) return;

    try {
      const payload = {
        status,
        statusUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (status === "cancelled") {
        payload.cancelledAt = serverTimestamp();
        payload.refundedAt = null;
      }

      if (status === "refunded") {
        payload.refundedAt = serverTimestamp();
        payload.cancelledAt = null;
      }

      if (status === "reserved") {
        payload.cancelledAt = null;
        payload.refundedAt = null;
      }

      await updateDoc(doc(db, "contributions", contribution.id), payload);

      if (contribution.orderId && contribution.lineItemId) {
        const transactionsSnapshot = await getDocs(
          query(
            collection(db, "fundTransactions"),
            where("orderId", "==", contribution.orderId),
            where("lineItemId", "==", contribution.lineItemId)
          )
        );

        await Promise.all(
          transactionsSnapshot.docs.map((transactionDoc) =>
            updateDoc(transactionDoc.ref, payload)
          )
        );
      }
    } catch (error) {
      console.error("Erreur modification statut contribution:", error);
      alert("Impossible de modifier le statut de cette contribution.");
    }
  }

  async function createPayout() {
    const row = financeRows.find((item) => item.id === newPayout.targetKey);
    const amount = Number(newPayout.amount || 0);

    if (!row) {
      alert("Choisis un bénéficiaire.");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Le montant du versement doit être supérieur à 0.");
      return;
    }

    if (amount > row.balance) {
      const confirmed = window.confirm(
        `Le versement (${money(amount)}) dépasse le solde disponible (${money(row.balance)}). Continuer ?`
      );

      if (!confirmed) return;
    }

    const payoutRef = await addDoc(collection(db, "payouts"), {
      targetKey: row.id,
      beneficiaryLabel: row.label,
      beneficiaryType: row.type,
      athleteId: row.athleteId || null,
      familyId: row.familyId || null,
      fundingGroupId: row.fundingGroupId || null,
      campaignId: row.campaignId || "",
      campaignTitle: row.campaignTitle || "",
      amount,
      method: newPayout.method || "virement",
      note: newPayout.note || "",
      status: "paid",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    sendProgramNotification("payout_paid", payoutRef.id).catch((error) =>
      alert(`Versement enregistré, mais le courriel n’a pas été envoyé : ${error.message}`)
    );

    setNewPayout({ targetKey: "", amount: "", method: "virement", note: "" });
    alert("Versement enregistré.");
  }

  function approveMessage(id) {
    setWallMessages(
      wallMessages.map((message) =>
        message.id === id ? { ...message, status: "approuvé" } : message
      )
    );
  }

  function refuseMessage(id) {
    setWallMessages(
      wallMessages.map((message) =>
        message.id === id ? { ...message, status: "refusé" } : message
      )
    );
  }

  function renderCampaignForm(campaignState, setCampaignState, isEditing = false) {
    return (
      <div className="grid gap-4">
        <TextInput
          label="Titre"
          value={campaignState.title}
          onChange={(value) => setCampaignState({ ...campaignState, title: value })}
          placeholder="Ex. WKC Spain 2026"
        />

        <TextInput
          label="Titre anglais"
          value={campaignState.titleEn}
          onChange={(value) => setCampaignState({ ...campaignState, titleEn: value })}
          placeholder="Ex. WKC Spain 2026"
        />

        <TextInput
          label="Année"
          value={campaignState.year}
          onChange={(value) => setCampaignState({ ...campaignState, year: value })}
          placeholder="2026"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Pays"
            value={campaignState.country}
            onChange={(value) => setCampaignState({ ...campaignState, country: value })}
            placeholder="Ex. Espagne"
          />

          <TextInput
            label="Ville"
            value={campaignState.city}
            onChange={(value) => setCampaignState({ ...campaignState, city: value })}
            placeholder="Ex. Cadiz"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Lieu / bâtiment"
            value={campaignState.venueName}
            onChange={(value) => setCampaignState({ ...campaignState, venueName: value })}
            placeholder="Ex. Pabellón Ciudad de Chiclana"
          />
          <TextInput
            label="Organisateur"
            value={campaignState.organizer}
            onChange={(value) => setCampaignState({ ...campaignState, organizer: value })}
            placeholder="Ex. WKC World"
          />
        </div>

        <TextInput
          label="Fédération(s)"
          value={campaignState.federation}
          onChange={(value) => setCampaignState({ ...campaignState, federation: value })}
          placeholder="Ex. World Kickboxing Commission (WKC)"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaInput label="Disciplines — français" value={campaignState.disciplinesFr} onChange={(value) => setCampaignState({ ...campaignState, disciplinesFr: value })} />
          <TextAreaInput label="Disciplines — anglais" value={campaignState.disciplinesEn} onChange={(value) => setCampaignState({ ...campaignState, disciplinesEn: value })} />
          <TextAreaInput label="Qui est concerné — français" value={campaignState.audienceFr} onChange={(value) => setCampaignState({ ...campaignState, audienceFr: value })} />
          <TextAreaInput label="Who it is for — English" value={campaignState.audienceEn} onChange={(value) => setCampaignState({ ...campaignState, audienceEn: value })} />
          <TextAreaInput label="Présentation détaillée — français" value={campaignState.overviewFr} onChange={(value) => setCampaignState({ ...campaignState, overviewFr: value })} />
          <TextAreaInput label="Detailed overview — English" value={campaignState.overviewEn} onChange={(value) => setCampaignState({ ...campaignState, overviewEn: value })} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Date de début"
            type="date"
            value={campaignState.startDate}
            onChange={(value) => setCampaignState({ ...campaignState, startDate: value })}
          />

          <TextInput
            label="Date de fin"
            type="date"
            value={campaignState.endDate}
            onChange={(value) => setCampaignState({ ...campaignState, endDate: value })}
          />

          <TextInput
            label="Date de compétition / événement"
            type="date"
            value={campaignState.eventDate}
            onChange={(value) => setCampaignState({ ...campaignState, eventDate: value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Début de l’événement"
            type="date"
            value={campaignState.eventStartDate}
            onChange={(value) => setCampaignState({ ...campaignState, eventStartDate: value })}
          />
          <TextInput
            label="Fin de l’événement"
            type="date"
            value={campaignState.eventEndDate}
            onChange={(value) => setCampaignState({ ...campaignState, eventEndDate: value })}
          />
        </div>

        <TextInput
          label="Objectif global"
          type="number"
          value={campaignState.goal}
          onChange={(value) => setCampaignState({ ...campaignState, goal: value })}
          placeholder="Ex. 7000"
        />

        <TextInput
          label="Lien Shopify principal"
          value={campaignState.shopifyUrl}
          onChange={(value) => setCampaignState({ ...campaignState, shopifyUrl: value })}
          placeholder="https://kinkolab.com/..."
          hint="Optionnel. Peut servir de lien principal de campagne."
        />

        <TextInput
          label="Handle collection Shopify"
          value={campaignState.collectionHandle}
          onChange={(value) => setCampaignState({ ...campaignState, collectionHandle: value })}
          placeholder="Ex. wkc-2026-road-to-spain"
        />

        <TextInput
          label="URL collection Shopify complète"
          value={campaignState.shopifyCollectionUrl || campaignState.collectionUrl}
          onChange={(value) =>
            setCampaignState({
              ...campaignState,
              shopifyCollectionUrl: value,
              collectionUrl: value,
            })
          }
          placeholder="https://kinkolab.com/collections/wkc-2026-road-to-spain"
          hint="C’est le lien utilisé par le bouton Voir la collection Shopify."
        />

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} style={{ color: gold }} />
            <p className="text-sm font-black uppercase text-zinc-700">
              Bannière de la campagne
            </p>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <TextInput
              label="URL bannière Firebase"
              value={campaignState.bannerImageUrl}
              onChange={(value) => setCampaignState({ ...campaignState, bannerImageUrl: value })}
              placeholder="https://firebasestorage.googleapis.com/..."
            />

            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-black text-white">
              <Upload size={16} /> Uploader
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  uploadCampaignBanner(campaignState, setCampaignState, event.target.files?.[0])
                }
              />
            </label>
          </div>

          {campaignState.bannerImageUrl && (
            <img
              src={campaignState.bannerImageUrl}
              alt="Bannière campagne"
              className="mt-3 h-40 w-full rounded-2xl object-cover"
            />
          )}
        </div>

        <TextInput
          label="Lien commandite"
          value={campaignState.sponsorUrl}
          onChange={(value) => setCampaignState({ ...campaignState, sponsorUrl: value })}
          placeholder="Lien vers une page ou un formulaire de commandite"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Site officiel" value={campaignState.websiteUrl} onChange={(value) => setCampaignState({ ...campaignState, websiteUrl: value })} placeholder="https://..." />
          <TextInput label="Facebook" value={campaignState.facebookUrl} onChange={(value) => setCampaignState({ ...campaignState, facebookUrl: value })} placeholder="https://facebook.com/..." />
          <TextInput label="Instagram" value={campaignState.instagramUrl} onChange={(value) => setCampaignState({ ...campaignState, instagramUrl: value })} placeholder="https://instagram.com/..." />
          <TextInput label="YouTube" value={campaignState.youtubeUrl} onChange={(value) => setCampaignState({ ...campaignState, youtubeUrl: value })} placeholder="https://youtube.com/..." />
        </div>

        <TextInput
          label="Vidéo à afficher"
          value={campaignState.videoUrl}
          onChange={(value) => setCampaignState({ ...campaignState, videoUrl: value })}
          placeholder="Lien YouTube ou Vimeo"
        />

        <TextAreaInput
          label="Galerie d’images"
          value={campaignState.galleryImageUrls}
          onChange={(value) => setCampaignState({ ...campaignState, galleryImageUrls: value })}
          placeholder="Une URL d’image par ligne"
          hint="Ajoutez une adresse par ligne. Les images apparaîtront dans la galerie publique."
        />

        <TextAreaInput
          label="Description"
          value={campaignState.description}
          onChange={(value) => setCampaignState({ ...campaignState, description: value })}
          placeholder="Description publique de la campagne"
        />

        <TextAreaInput
          label="Description anglaise"
          value={campaignState.descriptionEn}
          onChange={(value) => setCampaignState({ ...campaignState, descriptionEn: value })}
          placeholder="Public campaign description in English"
        />

        <ProductEditor
          campaignState={campaignState}
          setCampaignState={setCampaignState}
          onUploadProductImage={(index, file) =>
            uploadCampaignProductImage(campaignState, setCampaignState, index, file)
          }
        />

        {isEditing ? (
          <div className="flex gap-2">
            <AdminButton variant="green" onClick={saveEditedCampaign}>
              Sauvegarder
            </AdminButton>
            <AdminButton variant="light" onClick={() => setEditingCampaignId("")}>
              Annuler
            </AdminButton>
          </div>
        ) : (
          <AdminButton onClick={createCampaign}>
            <Save size={16} /> Créer la campagne
          </AdminButton>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={goBack}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft size={17} /> Retour
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Admin privé
          </p>
          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">
            Dashboard admin Kinko Athletes
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Gestion des candidatures, athlètes, familles, campagnes, participations et validations.
          </p>
        </section>

        {acceptedAccess && (
          <section className="mt-8 rounded-[2rem] border border-emerald-300 bg-emerald-50 p-6 shadow-xl">
            <h2 className="text-2xl font-black text-emerald-900">Compte athlète créé</h2>
            <p className="mt-2 text-sm text-emerald-800">Un courriel sécurisé permet maintenant à l’athlète de choisir son propre mot de passe.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Athlete ID</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.athleteId}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Courriel</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.email}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <AdminButton variant="light" onClick={() => setAcceptedAccess(null)}>
                Fermer
              </AdminButton>

              <AdminButton variant="light" onClick={() => onOpenAthlete(acceptedAccess.athleteId)}>
                <Eye size={16} /> Voir la page publique
              </AdminButton>
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard light icon={Users} label="Athlètes" value={athletes.length} sub="Profils" />
          <StatCard light icon={Megaphone} label="Campagnes" value={allCampaigns.length} sub="Total" />
          <StatCard light icon={Link2} label="Participations" value={participations.length} sub="Campagnes liées" />
          <StatCard light icon={DollarSign} label="Fonds réservés" value={money(financialSummary.reserved)} sub="Shopify / contributions" />
        </section>

        <section className="mt-8 flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-2xl px-5 py-3 font-black ${
                activeTab === key ? "bg-black text-white" : "bg-white text-zinc-950"
              }`}
            >
              {label}
            </button>
          ))}
        </section>

        {activeTab === "candidatures" && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <PencilLine style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">Demandes en attente</h2>
            </div>

            <div className="mt-5 space-y-4">
              {loading && <p className="text-zinc-500">Chargement...</p>}
              {!loading && pendingApplications.length === 0 && (
                <p className="text-zinc-500">Aucune demande en attente.</p>
              )}

              {pendingApplications.map((application) => {
                const athleteName =
                  application.athleteName ||
                  `${application.firstName || ""} ${application.lastName || ""}`.trim();

                return (
                  <div key={application.id} className="rounded-2xl border border-zinc-200 p-5">
                    {application.photo && (
                      <img
                        src={application.photo}
                        alt={athleteName}
                        className="mb-4 h-56 w-full rounded-2xl object-cover"
                      />
                    )}

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-2xl font-black text-zinc-950">
                          {athleteName || "Nom à confirmer"}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {application.city || "Ville inconnue"} · {application.province || "Province inconnue"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">Dojo : {application.dojo || "À confirmer"}</p>
                        <p className="mt-1 text-sm text-zinc-600">Objectif : {money(Number(application.desiredGoal || 0))}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <AdminButton
                          variant="green"
                          disabled={actionLoadingId === application.id}
                          onClick={() => acceptApplication(application)}
                        >
                          <CheckCircle2 size={17} />
                          {actionLoadingId === application.id ? "Traitement..." : "Accepter"}
                        </AdminButton>

                        <AdminButton
                          variant="red"
                          disabled={actionLoadingId === application.id}
                          onClick={() => refuseApplication(application)}
                        >
                          <XCircle size={17} /> Refuser
                        </AdminButton>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                      <p><b>Courriel athlète :</b> {application.email}</p>
                      <p><b>Parent :</b> {application.parentName}</p>
                      <p><b>Courriel parent :</b> {application.parentEmail}</p>
                      <p><b>Téléphone parent :</b> {application.parentPhone}</p>
                      <p><b>Coach :</b> {application.coach}</p>
                      <p><b>Discipline :</b> {application.discipline}</p>
                      <p><b>Ceinture :</b> {application.belt}</p>
                      <p><b>Famille :</b> {application.familyName}</p>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-black text-zinc-700">Campagne associée</label>
                      <select
                        value={application.campaignId || ""}
                        onChange={(event) => updateApplicationCampaign(application.id, event.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950"
                      >
                        {allCampaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                        ))}
                      </select>
                    </div>

                    {application.motivation && (
                      <div className="mt-4 rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-700">
                        <b>Motivation :</b>
                        <p className="mt-1">{application.motivation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "athletes" && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-zinc-950">Gestion des athlètes</h2>

            <div className="mt-5 space-y-3">
              {athletes.map((athlete) => (
                <div key={athlete.id} className="rounded-2xl border border-zinc-200 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-xl font-black text-zinc-950">
                        {athlete.avatar} {athlete.name}
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {athlete.dojo} · {campaignTitle(allCampaigns, athlete.campaignId)}
                      </p>
                      <div className="mt-2"><StatusPill status={athlete.status || "actif"} /></div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AdminButton variant="light" onClick={() => onOpenAthlete(athlete.id)}><Eye size={16} /> Voir</AdminButton>
                      <AdminButton variant="amber" onClick={() => updateAthleteStatus(athlete, "suspendu")}><Ban size={16} /> Suspendre</AdminButton>
                      <AdminButton variant="green" onClick={() => updateAthleteStatus(athlete, "actif")}><RotateCcw size={16} /> Réactiver</AdminButton>
                      <AdminButton variant="light" onClick={() => updateAthleteStatus(athlete, "archivé")}><Archive size={16} /> Archiver</AdminButton>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-zinc-600">
                    Progression : <b>{progressOf(athlete)}%</b> · Objectif : <b>{money(athlete.goal || 0)}</b>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "families" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Shield style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Créer une famille</h2>
              </div>

              <div className="mt-5 grid gap-3">
                <TextInput label="Nom de famille" value={newFamily.name} onChange={(value) => setNewFamily({ ...newFamily, name: value })} />
                <TextInput label="Parent responsable" value={newFamily.contactName} onChange={(value) => setNewFamily({ ...newFamily, contactName: value })} />
                <TextInput label="Courriel principal" value={newFamily.contactEmail} onChange={(value) => setNewFamily({ ...newFamily, contactEmail: value })} />
                <AdminButton onClick={createFamily}><Save size={16} /> Créer la famille</AdminButton>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Familles existantes</h2>

              <div className="mt-5 space-y-4">
                {families.length === 0 && <p className="text-zinc-500">Aucune famille créée.</p>}

                {families.map((family) => {
                  const familyAthletes = athletes.filter((athlete) => athlete.familyId === family.id);

                  return (
                    <div key={family.id} className="rounded-2xl border border-zinc-200 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black">{family.name}</h3>
                          <p className="text-sm text-zinc-500">{family.contactName || "Responsable non défini"}</p>
                          <p className="text-sm text-zinc-500">{family.contactEmail}</p>
                        </div>
                        <StatusPill status={family.status || "active"} />
                      </div>

                      <div className="mt-5 space-y-2">
                        <p className="text-sm font-black text-zinc-700">Athlètes de la famille</p>
                        {familyAthletes.length === 0 && <p className="text-sm text-zinc-400">Aucun athlète rattaché.</p>}

                        {familyAthletes.map((athlete) => (
                          <div key={athlete.id} className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3">
                            <span className="font-bold">{athlete.avatar} {athlete.name}</span>
                            <AdminButton variant="red" onClick={() => removeAthleteFromFamily(athlete, family)}>
                              <Trash2 size={15} /> Retirer
                            </AdminButton>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 space-y-2">
                        <p className="text-sm font-black text-zinc-700">Ajouter un athlète sans famille</p>
                        {athletesWithoutFamily.length === 0 && <p className="text-sm text-zinc-400">Aucun athlète disponible.</p>}

                        {athletesWithoutFamily.map((athlete) => (
                          <button
                            key={athlete.id}
                            onClick={() => addAthleteToFamily(athlete, family)}
                            className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-100"
                          >
                            <span>{athlete.avatar} {athlete.name}</span>
                            <UserPlus2 size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === "campaigns" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Plus style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Créer une campagne</h2>
              </div>

              <div className="mt-5">{renderCampaignForm(newCampaign, setNewCampaign)}</div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <FolderKanban style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Campagnes existantes</h2>
              </div>

              <div className="mt-5 space-y-3">
                {allCampaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-2xl border border-zinc-200 p-5">
                    {editingCampaignId === campaign.id ? (
                      renderCampaignForm(editingCampaign, setEditingCampaign, true)
                    ) : (
                      <>
                        {campaign.bannerImageUrl && (
                          <img src={campaign.bannerImageUrl} alt={campaign.title} className="mb-4 h-40 w-full rounded-2xl object-cover" />
                        )}

                        <h3 className="text-xl font-black text-zinc-950">{campaign.title}</h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {campaign.year || ""} · {campaign.city || ""} {campaign.country || ""} · Objectif : {money(Number(campaign.goal || 0))}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Début : {campaign.startDate || "—"} · Fin : {campaign.endDate || "—"} · Événement : {campaign.eventDate || "—"}
                        </p>

                        {(campaign.collectionHandle || campaign.collectionUrl || campaign.shopifyCollectionUrl) && (
                          <p className="mt-1 text-sm text-zinc-600">
                            Collection Shopify : <b>{campaign.collectionHandle || campaign.collectionUrl || campaign.shopifyCollectionUrl}</b>
                          </p>
                        )}

                        {campaign.products?.length > 0 && (
                          <p className="mt-1 text-sm text-zinc-600">Produits liés : <b>{campaign.products.length}</b></p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusPill status={campaign.status || "active"} />

                          {(campaign.shopifyCollectionUrl || campaign.collectionUrl || campaign.shopifyUrl) && (
                            <a
                              href={campaign.shopifyCollectionUrl || campaign.collectionUrl || campaign.shopifyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-950"
                            >
                              <ExternalLink size={15} /> Shopify
                            </a>
                          )}

                          <AdminButton variant="light" onClick={() => startEditCampaign(campaign)}>Modifier</AdminButton>
                          <AdminButton variant="green" onClick={() => updateCampaignStatus(campaign, "active")}>Active</AdminButton>
                          <AdminButton variant="amber" onClick={() => updateCampaignStatus(campaign, "suspendue")}>Suspendre</AdminButton>
                          <AdminButton variant="light" onClick={() => updateCampaignStatus(campaign, "terminee")}>Terminée</AdminButton>
                          <AdminButton variant="light" onClick={() => updateCampaignStatus(campaign, "archivée")}>Archiver</AdminButton>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "participations" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Link2 style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Créer une participation</h2>
              </div>

              <div className="mt-5 grid gap-3">
                <SelectInput label="Athlète" value={newParticipation.athleteId} onChange={(value) => setNewParticipation({ ...newParticipation, athleteId: value })}>
                  <option value="">Choisir un athlète</option>
                  {athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name}</option>)}
                </SelectInput>

                <SelectInput label="Campagne" value={newParticipation.campaignId} onChange={(value) => setNewParticipation({ ...newParticipation, campaignId: value })}>
                  <option value="">Choisir une campagne</option>
                  {allCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
                </SelectInput>

                <SelectInput label="Mode de financement" value={newParticipation.fundingMode} onChange={(value) => setNewParticipation({ ...newParticipation, fundingMode: value })}>
                  <option value="individual">Individuel</option>
                  <option value="family">Famille / fonds commun</option>
                </SelectInput>

                <TextInput label="Objectif de participation" type="number" value={newParticipation.goal} onChange={(value) => setNewParticipation({ ...newParticipation, goal: value })} />

                <AdminButton onClick={createParticipation}><Save size={16} /> Créer la participation</AdminButton>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Participations existantes</h2>

              <div className="mt-5 space-y-3">
                {participations.length === 0 && <p className="text-zinc-500">Aucune participation créée.</p>}

                {participations.map((participation) => (
                  <div key={participation.id} className="rounded-2xl border border-zinc-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-zinc-950">{participationAthleteName(participation.athleteId)}</h3>
                        <p className="text-sm text-zinc-500">{participationCampaignName(participation.campaignId)}</p>
                        <p className="mt-1 text-sm text-zinc-500">Mode : <b>{participation.fundingMode === "family" ? "Famille" : "Individuel"}</b></p>
                        <p className="text-sm text-zinc-500">Groupe fonds : {participation.fundingGroupId}</p>
                      </div>

                      <StatusPill status={participation.status || "active"} />
                    </div>

                    <div className="mt-3 text-sm text-zinc-600">
                      Objectif : <b>{money(participation.goal || 0)}</b> · Collecté : <b>{money(Number(participation.raisedShop || 0) + Number(participation.raisedOffline || 0) + Number(participation.raisedSponsorship || 0))}</b>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <AdminButton variant="green" onClick={() => updateParticipationStatus(participation, "active")}>Active</AdminButton>
                      <AdminButton variant="amber" onClick={() => updateParticipationStatus(participation, "suspendue")}>Suspendre</AdminButton>
                      <AdminButton variant="light" onClick={() => updateParticipationStatus(participation, "terminee")}>Terminée</AdminButton>
                      <AdminButton variant="light" onClick={() => updateParticipationStatus(participation, "archivée")}>Archiver</AdminButton>
                      <AdminButton variant="red" onClick={() => deleteParticipation(participation)}><Trash2 size={15} /> Supprimer</AdminButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "finances" && (
          <section className="mt-8 space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <DollarSign style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Finances athlètes</h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Suivi des montants réservés automatiquement depuis Shopify et des versements réellement effectués aux athlètes ou familles.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-6">
                <StatCard light icon={DollarSign} label="Actif" value={money(financialSummary.reserved)} sub="Contributions actives" />
                <StatCard light icon={CheckCircle2} label="Versé" value={money(financialSummary.paid)} sub="Versements enregistrés" />
                <StatCard light icon={FolderKanban} label="Solde" value={money(financialSummary.balance)} sub="À verser" />
                <StatCard light icon={Link2} label="Actives" value={financialSummary.count} sub="Transactions" />
                <StatCard light icon={XCircle} label="Annulées" value={money(financialSummary.cancelled)} sub={`${financialSummary.cancelledCount} transaction(s)`} />
                <StatCard light icon={RotateCcw} label="Remboursées" value={money(financialSummary.refunded)} sub={`${financialSummary.refundedCount} transaction(s)`} />
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Enregistrer un versement</h2>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Utilise ce formulaire lorsqu’un montant est réellement versé à un athlète ou à une famille.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_0.6fr_0.7fr]">
                <select
                  value={newPayout.targetKey}
                  onChange={(event) => setNewPayout({ ...newPayout, targetKey: event.target.value })}
                  className="rounded-2xl border border-zinc-200 p-3"
                >
                  <option value="">Choisir un bénéficiaire</option>
                  {financeRows.map((row) => (
                    <option key={row.id} value={row.id}>{row.label} — {row.campaignTitle || "Campagne"} — solde {money(row.balance)}</option>
                  ))}
                </select>

                <input
                  type="number"
                  value={newPayout.amount}
                  onChange={(event) => setNewPayout({ ...newPayout, amount: event.target.value })}
                  placeholder="Montant versé"
                  className="rounded-2xl border border-zinc-200 p-3"
                />

                <select
                  value={newPayout.method}
                  onChange={(event) => setNewPayout({ ...newPayout, method: event.target.value })}
                  className="rounded-2xl border border-zinc-200 p-3"
                >
                  <option value="virement">Virement</option>
                  <option value="interac">Interac</option>
                  <option value="cheque">Chèque</option>
                  <option value="cash">Comptant</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={newPayout.note}
                  onChange={(event) => setNewPayout({ ...newPayout, note: event.target.value })}
                  placeholder="Note interne, référence de paiement, période, etc."
                  className="rounded-2xl border border-zinc-200 p-3"
                />

                <AdminButton variant="green" onClick={createPayout}><Save size={16} /> Enregistrer le versement</AdminButton>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Soldes par athlète / famille</h2>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200">
                <div className="grid min-w-[900px] grid-cols-[1.2fr_0.7fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 bg-zinc-100 p-4 text-xs font-black uppercase text-zinc-500">
                  <span>Bénéficiaire</span><span>Type</span><span>Campagne</span><span>Réservé</span><span>Versé</span><span>Solde</span>
                </div>

                {financeRows.length === 0 && <p className="p-5 text-zinc-500">Aucune contribution enregistrée pour le moment.</p>}

                {financeRows.map((row) => (
                  <div key={row.id} className="grid min-w-[900px] grid-cols-[1.2fr_0.7fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 border-t border-zinc-200 p-4 text-sm text-zinc-700">
                    <span className="font-black text-zinc-950">{row.label}</span>
                    <span>{row.type}</span>
                    <span>{row.campaignTitle || "—"}</span>
                    <span className="font-black">{money(row.reserved)}</span>
                    <span>{money(row.paid)}</span>
                    <span className="font-black" style={{ color: gold }}>{money(row.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Historique des versements</h2>

              <div className="mt-5 space-y-3">
                {payouts.length === 0 && <p className="text-zinc-500">Aucun versement enregistré pour le moment.</p>}

                {payouts.map((payout) => (
                  <div key={payout.id} className="rounded-2xl border border-zinc-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase text-zinc-400">{payoutDate(payout)} · {payout.method || "Méthode non précisée"}</p>
                        <h3 className="mt-1 text-lg font-black text-zinc-950">{payout.beneficiaryLabel || "Bénéficiaire"}</h3>
                        <p className="mt-1 text-sm text-zinc-500">Campagne : {payout.campaignTitle || payout.campaignId || "—"}</p>
                        {payout.note && <p className="mt-1 text-sm text-zinc-500">Note : {payout.note}</p>}
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-black text-zinc-950">{money(payoutAmount(payout))}</p>
                        <StatusPill status="versé" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Historique Shopify</h2>

              <div className="mt-5 space-y-3">
                {contributions.length === 0 && <p className="text-zinc-500">Aucune contribution enregistrée.</p>}

                {contributions.map((contribution) => (
                  <div key={contribution.id} className="rounded-2xl border border-zinc-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase text-zinc-400">{contributionDate(contribution)} · {contribution.orderName || contribution.orderId || "Commande Shopify"}</p>
                        <h3 className="mt-1 text-lg font-black text-zinc-950">{contribution.productName || contribution.productTitle || "Produit Shopify"}</h3>
                        <p className="mt-1 text-sm text-zinc-500">Soutien : {contribution.supportLabel || contribution.athleteName || contribution.familyName || "—"}</p>
                        <p className="mt-1 text-sm text-zinc-500">Client : {contribution.customerName || contribution.customerEmail || "—"}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-black text-zinc-950">{money(contributionAmount(contribution))}</p>
                        <StatusPill status={contribution.status || "reserved"} />

                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          {contribution.status !== "cancelled" && (
                            <AdminButton
                              variant="red"
                              onClick={() => updateContributionStatus(contribution, "cancelled")}
                            >
                              <XCircle size={15} /> Annuler
                            </AdminButton>
                          )}

                          {contribution.status !== "refunded" && (
                            <AdminButton
                              variant="amber"
                              onClick={() => updateContributionStatus(contribution, "refunded")}
                            >
                              <RotateCcw size={15} /> Rembourser
                            </AdminButton>
                          )}

                          {contribution.status !== "reserved" && (
                            <AdminButton
                              variant="green"
                              onClick={() => updateContributionStatus(contribution, "reserved")}
                            >
                              <CheckCircle2 size={15} /> Réactiver
                            </AdminButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "communications" && (
          <div className="mt-8 space-y-8">
            <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <Mail style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Centre de communications</h2>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                    Modifie les courriels automatiques en français et en anglais, crée des modèles et consulte les envois.
                  </p>
                </div>
                <AdminButton variant="light" onClick={createEmailTemplate}>
                  <Plus size={16} /> Nouveau modèle
                </AdminButton>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-black">Variables disponibles</p>
                <p className="mt-1 font-mono text-xs">{"{{name}} · {{campaign}} · {{amount}} · {{loginUrl}} · {{accountSetupUrl}}"}</p>
              </div>

              <div className="mt-6 max-w-xl">
                <SelectInput
                  label="Choisir le workflow et son modèle"
                  value={selectedEmailTemplateKey}
                  onChange={(key) => {
                    const selected = emailTemplates.find((template) => template.key === key);
                    if (selected) selectEmailTemplate(selected);
                  }}
                >
                  <option value="" disabled>Sélectionner…</option>
                  {workflowOptions.map((workflow) => <option key={workflow.key} value={workflow.key}>{workflow.label}</option>)}
                  {emailTemplates.filter((template) => !workflowOptions.some((workflow) => workflow.key === template.key)).map((template) => <option key={template.key} value={template.key}>{template.name} — manuel</option>)}
                </SelectInput>
              </div>

              {emailCenterLoading && <p className="mt-6 text-zinc-500">Chargement des communications…</p>}

              <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
                <div className="space-y-3">
                  {emailTemplates.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => selectEmailTemplate(template)}
                      className={`w-full rounded-2xl border p-4 text-left ${selectedEmailTemplateKey === template.key ? "border-black bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-950"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-black">{template.name}</p>
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${template.enabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${selectedEmailTemplateKey === template.key ? "text-zinc-300" : "text-zinc-500"}`}>{template.trigger || "Envoi manuel"}</p>
                    </button>
                  ))}
                  {editingEmailTemplate && !emailTemplates.some((template) => template.key === editingEmailTemplate.key) && (
                    <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-4">
                      <p className="font-black text-zinc-950">Nouveau modèle non enregistré</p>
                    </div>
                  )}
                </div>

                {editingEmailTemplate && (
                  <div className="rounded-2xl border border-zinc-200 p-5 md:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Nom du modèle" value={editingEmailTemplate.name} onChange={(value) => setEditingEmailTemplate({ ...editingEmailTemplate, name: value })} />
                      <AdminField label="Déclencheur / workflow" hint="Ce déclencheur est déterminé par le portail et ne peut pas être modifié accidentellement.">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-3 font-bold text-zinc-700">{workflowOptions.find((workflow) => workflow.key === editingEmailTemplate.key)?.trigger || editingEmailTemplate.trigger || "Envoi manuel"}</div>
                      </AdminField>
                    </div>

                    <label className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-100 p-4 font-black text-zinc-950">
                      <input type="checkbox" checked={editingEmailTemplate.enabled !== false} onChange={(event) => setEditingEmailTemplate({ ...editingEmailTemplate, enabled: event.target.checked })} className="h-5 w-5" />
                      Workflow actif
                    </label>

                    <div className="mt-6 grid gap-6 xl:grid-cols-2">
                      {[["fr", "Version française"], ["en", "English version"]].map(([language, label]) => (
                        <div key={language} className="rounded-2xl bg-zinc-50 p-4">
                          <h3 className="text-lg font-black text-zinc-950">{label}</h3>
                          <div className="mt-4 space-y-4">
                            <TextInput label="Objet" value={editingEmailTemplate[language]?.subject} onChange={(value) => updateEmailContent(language, "subject", value)} />
                            <TextInput label="Titre" value={editingEmailTemplate[language]?.title} onChange={(value) => updateEmailContent(language, "title", value)} />
                            <TextAreaInput label="Message" value={editingEmailTemplate[language]?.body} onChange={(value) => updateEmailContent(language, "body", value)} hint="Laisse une ligne vide entre les paragraphes." />
                            <TextInput label="Texte du bouton" value={editingEmailTemplate[language]?.buttonLabel} onChange={(value) => updateEmailContent(language, "buttonLabel", value)} placeholder="Optionnel" />
                            <TextInput label="Lien du bouton" value={editingEmailTemplate[language]?.buttonUrl} onChange={(value) => updateEmailContent(language, "buttonUrl", value)} placeholder="https://… ou {{loginUrl}}" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 border-t border-zinc-200 pt-8">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Palette style={{ color: gold }} />
                          <div>
                            <h3 className="text-xl font-black text-zinc-950">Design du courriel</h3>
                            <p className="text-sm text-zinc-500">Les changements apparaissent immédiatement dans l’aperçu.</p>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-black px-4 py-3 text-right text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Modèle affiché</p>
                          <p className="mt-1 font-black">{editingEmailTemplate.name}</p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <SelectInput label="Changer le modèle affiché dans l’éditeur de design" value={selectedEmailTemplateKey} onChange={(key) => selectEmailTemplate(emailTemplates.find((template) => template.key === key))}>
                          {emailTemplates.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}
                        </SelectInput>
                      </div>

                      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
                        <div className="space-y-5">
                          <div className="rounded-2xl bg-zinc-50 p-4">
                            <p className="font-black text-zinc-950">Glisser-déposer les blocs</p>
                            <p className="mt-1 text-xs text-zinc-500">Prends un bloc et déplace-le à la position souhaitée.</p>
                            <div className="mt-3 space-y-2">
                              {(editingEmailTemplate.design?.blocks || defaultEmailDesign.blocks).map((block) => (
                                <div
                                  key={block}
                                  draggable
                                  onDragStart={() => setDraggedEmailBlock(block)}
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={() => moveEmailBlock(block)}
                                  className="flex cursor-grab items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 font-bold text-zinc-800 active:cursor-grabbing"
                                >
                                  <GripVertical size={18} className="text-zinc-400" /> {emailBlockLabels[block] || block}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-4">
                            {[
                              ["backgroundColor", "Arrière-plan"], ["cardColor", "Carte"],
                              ["headingColor", "Titres"], ["textColor", "Texte"],
                              ["accentColor", "Accent / bouton"], ["buttonTextColor", "Texte bouton"],
                            ].map(([field, label]) => (
                              <label key={field} className="text-xs font-bold text-zinc-600">
                                {label}
                                <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2">
                                  <input type="color" value={(editingEmailTemplate.design?.[field] || defaultEmailDesign[field])} onChange={(event) => updateEmailDesign(field, event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent" />
                                  <span className="font-mono text-[10px]">{editingEmailTemplate.design?.[field] || defaultEmailDesign[field]}</span>
                                </div>
                              </label>
                            ))}
                          </div>

                          <SelectInput label="Alignement" value={editingEmailTemplate.design?.alignment || defaultEmailDesign.alignment} onChange={(value) => updateEmailDesign("alignment", value)}>
                            <option value="left">À gauche</option><option value="center">Centré</option><option value="right">À droite</option>
                          </SelectInput>
                          <div className="grid grid-cols-2 gap-3">
                            <TextInput label="Coins arrondis" type="number" value={editingEmailTemplate.design?.borderRadius ?? defaultEmailDesign.borderRadius} onChange={(value) => updateEmailDesign("borderRadius", Number(value))} />
                            <TextInput label="Largeur maximale" type="number" value={editingEmailTemplate.design?.contentWidth ?? defaultEmailDesign.contentWidth} onChange={(value) => updateEmailDesign("contentWidth", Number(value))} />
                          </div>
                          <TextInput label="URL du logo" value={editingEmailTemplate.design?.logoUrl ?? defaultEmailDesign.logoUrl} onChange={(value) => updateEmailDesign("logoUrl", value)} />
                          <TextInput label="URL de l’image principale" value={editingEmailTemplate.design?.heroImageUrl || ""} onChange={(value) => updateEmailDesign("heroImageUrl", value)} placeholder="Optionnel" />
                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-950">
                            <Upload size={16} /> Téléverser une image
                            <input type="file" accept="image/*" className="hidden" onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              try {
                                setEmailActionLoading(true);
                                const url = await uploadAdminImage(file, `email-templates/${editingEmailTemplate.key}`);
                                updateEmailDesign("heroImageUrl", url);
                              } catch { alert("Impossible de téléverser cette image."); }
                              finally { setEmailActionLoading(false); }
                            }} />
                          </label>
                        </div>

                        <div className="min-w-0 rounded-2xl bg-zinc-200 p-4 md:p-6">
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setPreviewLanguage("fr")} className={`rounded-xl px-3 py-2 text-sm font-black ${previewLanguage === "fr" ? "bg-black text-white" : "bg-white text-black"}`}>FR</button>
                              <button type="button" onClick={() => setPreviewLanguage("en")} className={`rounded-xl px-3 py-2 text-sm font-black ${previewLanguage === "en" ? "bg-black text-white" : "bg-white text-black"}`}>EN</button>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" aria-label="Aperçu ordinateur" onClick={() => setPreviewMobile(false)} className={`rounded-xl p-2 ${!previewMobile ? "bg-black text-white" : "bg-white text-black"}`}><Monitor size={18} /></button>
                              <button type="button" aria-label="Aperçu mobile" onClick={() => setPreviewMobile(true)} className={`rounded-xl p-2 ${previewMobile ? "bg-black text-white" : "bg-white text-black"}`}><Smartphone size={18} /></button>
                            </div>
                          </div>
                          <div className="overflow-x-auto rounded-xl py-4">
                            <EmailPreview template={{ ...editingEmailTemplate, design: { ...defaultEmailDesign, ...(editingEmailTemplate.design || {}) } }} language={previewLanguage} mobile={previewMobile} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <AdminButton disabled={emailActionLoading} onClick={saveEmailTemplate}>
                        <Save size={16} /> {emailActionLoading ? "Traitement…" : "Enregistrer"}
                      </AdminButton>
                    </div>

                    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className="font-black text-zinc-950">Envoyer un test</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_130px_auto] md:items-end">
                        <TextInput label="Adresse de test" type="email" value={testEmail} onChange={setTestEmail} placeholder="votre@courriel.com" />
                        <SelectInput label="Langue" value={testLanguage} onChange={setTestLanguage}>
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </SelectInput>
                        <AdminButton variant="amber" disabled={emailActionLoading} onClick={sendTestEmail}>
                          <Send size={16} /> Envoyer le test
                        </AdminButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-zinc-950">Historique des envois</h2>
                  <p className="mt-1 text-sm text-zinc-500">Les 100 courriels les plus récents, y compris les tests.</p>
                </div>
                <AdminButton variant="light" onClick={loadEmailCenter}><RotateCcw size={16} /> Actualiser</AdminButton>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead><tr className="border-b text-xs uppercase text-zinc-500"><th className="p-3">Date</th><th className="p-3">Modèle</th><th className="p-3">Destinataire</th><th className="p-3">Langue</th><th className="p-3">Statut</th></tr></thead>
                  <tbody>
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="border-b border-zinc-100">
                        <td className="p-3 text-zinc-600">{log.createdAt ? new Date(log.createdAt).toLocaleString("fr-CA") : "—"}</td>
                        <td className="p-3 font-bold text-zinc-950">{emailTemplates.find((template) => template.key === log.type)?.name || log.type}{log.test ? " (test)" : ""}</td>
                        <td className="p-3 text-zinc-600">{log.recipient}</td>
                        <td className="p-3 uppercase text-zinc-600">{log.language}</td>
                        <td className="p-3">
                          <StatusPill status={log.status} />
                          {log.events && <p className="mt-2 text-[10px] text-zinc-500">{Object.keys(log.events).join(" · ")}</p>}
                        </td>
                      </tr>
                    ))}
                    {!emailLogs.length && <tr><td colSpan="5" className="p-5 text-center text-zinc-500">Aucun envoi enregistré.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === "administrateurs" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-8">
              <div className="flex items-center gap-3"><Shield style={{ color: gold }} /><h2 className="text-2xl font-black text-zinc-950">Inviter un administrateur</h2></div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">La personne recevra un lien sécurisé pour choisir son mot de passe. Aucun mot de passe ne sera affiché ou transmis manuellement.</p>
              <div className="mt-6 space-y-4">
                <TextInput label="Nom complet" value={newAdmin.name} onChange={(value) => setNewAdmin({ ...newAdmin, name: value })} />
                <TextInput label="Adresse courriel" type="email" value={newAdmin.email} onChange={(value) => setNewAdmin({ ...newAdmin, email: value })} />
                <SelectInput label="Langue de l’invitation" value={newAdmin.language} onChange={(value) => setNewAdmin({ ...newAdmin, language: value })}><option value="fr">Français</option><option value="en">English</option></SelectInput>
                <AdminButton disabled={adminUsersLoading} onClick={inviteAdmin}><UserPlus2 size={17} /> {adminUsersLoading ? "Traitement…" : "Créer et envoyer l’invitation"}</AdminButton>
              </div>
            </section>
            <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-8">
              <h2 className="text-2xl font-black text-zinc-950">Administrateurs actuels</h2>
              <div className="mt-5 space-y-3">
                {adminUsersLoading && !adminUsers.length && <p className="text-zinc-500">Chargement…</p>}
                {adminUsers.map((item) => <div key={item.uid} className="rounded-2xl border border-zinc-200 p-4"><p className="font-black text-zinc-950">{item.name || "Administrateur"}</p><p className="mt-1 text-sm text-zinc-600">{item.email}</p></div>)}
                {!adminUsersLoading && !adminUsers.length && <p className="text-zinc-500">Aucun administrateur trouvé.</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === "messages" && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-zinc-950">Messages en attente</h2>

            <div className="mt-5 space-y-3">
              {pendingMessages.length === 0 && <p className="text-zinc-500">Aucun message à valider.</p>}

              {pendingMessages.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-200 p-4">
                  <p className="font-black text-zinc-950">{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{item.message}</p>

                  <div className="mt-4 flex gap-2">
                    <AdminButton variant="green" onClick={() => approveMessage(item.id)}>Approuver</AdminButton>
                    <AdminButton variant="red" onClick={() => refuseMessage(item.id)}>Refuser</AdminButton>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
