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
  Image as ImageIcon,
  Link2,
  Megaphone,
  PackagePlus,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Shield,
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
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "../firebase";

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
  year: "2026",
  type: "event",
  status: "active",
  country: "",
  city: "",
  startDate: "",
  endDate: "",
  eventDate: "",
  goal: "",
  shopifyUrl: "",
  sponsorUrl: "",
  collectionHandle: "",
  collectionUrl: "",
  shopifyCollectionUrl: "",
  bannerImageUrl: "",
  products: [],
  description: "",
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
  const [activeTab, setActiveTab] = useState("candidatures");
  const [applications, setApplications] = useState([]);
  const [families, setFamilies] = useState([]);
  const [firestoreCampaigns, setFirestoreCampaigns] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [payouts, setPayouts] = useState([]);

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
    const reserved = contributions.reduce(
      (sum, contribution) => sum + contributionAmount(contribution),
      0
    );

    const paid = payouts
      .filter((payout) => (payout.status || "paid") === "paid")
      .reduce((sum, payout) => sum + payoutAmount(payout), 0);

    return {
      reserved,
      paid,
      balance: Math.max(reserved - paid, 0),
      count: contributions.length,
      payoutCount: payouts.length,
    };
  }, [contributions, payouts]);

  const financeRows = useMemo(() => {
    const rows = new Map();

    contributions.forEach((contribution) => {
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
    ["messages", "Messages"],
  ];

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
        temporaryPassword: data.temporaryPassword,
      });
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
      year: campaign.year || "2026",
      type: campaign.type || "event",
      status: campaign.status || "active",
      country: campaign.country || "",
      city: campaign.city || "",
      startDate: campaign.startDate || "",
      endDate: campaign.endDate || "",
      eventDate: campaign.eventDate || "",
      goal: campaign.goal || "",
      shopifyUrl: campaign.shopifyUrl || "",
      sponsorUrl: campaign.sponsorUrl || "",
      collectionHandle: campaign.collectionHandle || "",
      collectionUrl: campaign.collectionUrl || campaign.shopifyCollectionUrl || "",
      shopifyCollectionUrl: campaign.shopifyCollectionUrl || campaign.collectionUrl || "",
      bannerImageUrl: campaign.bannerImageUrl || "",
      products: Array.isArray(campaign.products) ? campaign.products : [],
      description: campaign.description || "",
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

    await addDoc(collection(db, "payouts"), {
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

        <TextAreaInput
          label="Description"
          value={campaignState.description}
          onChange={(value) => setCampaignState({ ...campaignState, description: value })}
          placeholder="Description publique de la campagne"
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
            <p className="mt-2 text-sm text-emerald-800">Copie ces accès avant de quitter cette page.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Athlete ID</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.athleteId}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Courriel</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.email}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Mot de passe temporaire</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.temporaryPassword}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <AdminButton
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Courriel: ${acceptedAccess.email}\nMot de passe temporaire: ${acceptedAccess.temporaryPassword}`
                  );
                }}
              >
                Copier les accès
              </AdminButton>

              <AdminButton variant="light" onClick={() => setAcceptedAccess(null)}>
                J’ai copié les accès
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

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <StatCard light icon={DollarSign} label="Réservé" value={money(financialSummary.reserved)} sub="Total contributions" />
                <StatCard light icon={CheckCircle2} label="Versé" value={money(financialSummary.paid)} sub="Versements enregistrés" />
                <StatCard light icon={FolderKanban} label="Solde" value={money(financialSummary.balance)} sub="À verser" />
                <StatCard light icon={Link2} label="Transactions" value={financialSummary.count} sub="Contributions" />
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
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
