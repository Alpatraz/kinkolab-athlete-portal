import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AthletesPage from "./pages/AthletesPage";
import CampaignsPage from "./pages/CampaignsPage";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import AthletePublicPage from "./pages/AthletePublicPage";
import SignupView from "./pages/SignupView";
import LoginView from "./pages/LoginView";
import AdminView from "./pages/AdminView";
import AthleteDashboard from "./pages/AthleteDashboard";

import { auth, db } from "./firebase";

import {
  athletesSeed,
  campaignsSeed,
  updatesSeed,
  wallSeed,
} from "./data/demoData";

function AthleteRoute({ athletes, updates, wallMessages, setWallMessages, onOpenCampaign }) {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const athlete = athletes.find((item) => item.id === athleteId);

  if (!athlete) {
    return <Navigate to="/athletes" replace />;
  }

  return (
    <AthletePublicPage
      athlete={athlete}
      updates={updates || []}
      wallMessages={wallMessages || []}
      setWallMessages={setWallMessages}
      goBack={() => navigate(-1)}
      onOpenCampaign={onOpenCampaign}
    />
  );
}

function CampaignRoute({ campaigns, athletes, onOpenAthlete, openSignup }) {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const campaign = campaigns.find((item) => item.id === campaignId);

  if (!campaign) {
    return <Navigate to="/campaigns" replace />;
  }

  return (
    <CampaignDetailPage
      campaign={campaign}
      athletes={athletes}
      goBack={() => navigate(-1)}
      onOpenAthlete={onOpenAthlete}
      openSignup={openSignup}
    />
  );
}

function ProtectedAdminRoute({ currentUser, authLoading, children }) {
  if (authLoading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <h1 className="text-3xl font-black">Chargement...</h1>
      </main>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ProtectedDashboardRoute({ currentUser, authLoading, children }) {
  if (authLoading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <h1 className="text-3xl font-black">Chargement...</h1>
      </main>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function isPublicAthlete(athlete) {
  return (
    athlete?.isPublic !== false &&
    athlete?.status !== "suspendu" &&
    athlete?.status !== "archivé"
  );
}

export default function App() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [athletes, setAthletes] = useState(athletesSeed);
  const [firebaseCampaigns, setFirebaseCampaigns] = useState([]);
  const [wallMessages, setWallMessages] = useState(wallSeed);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};

        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name || firebaseUser.email,
          role: userData.role || "athlete",
          athleteId: userData.athleteId || null,
          athleteIds: userData.athleteIds || [],
          familyId: userData.familyId || null,
        });
      } catch (error) {
        console.error("Erreur récupération utilisateur:", error);
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.email,
          role: "athlete",
        });
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "athletes"), (snapshot) => {
      const firebaseAthletes = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const seedIds = new Set(athletesSeed.map((athlete) => athlete.id));
      const newAthletes = firebaseAthletes.filter((athlete) => !seedIds.has(athlete.id));

      setAthletes([...athletesSeed, ...newAthletes]);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setFirebaseCampaigns(data);
    });

    return () => unsubscribe();
  }, []);

  const campaigns = useMemo(() => {
    const map = new Map();

    campaignsSeed.forEach((campaign) => {
      map.set(campaign.id, { ...campaign, source: "seed" });
    });

    firebaseCampaigns.forEach((campaign) => {
      map.set(campaign.id, { ...campaign, source: "firestore" });
    });

    return Array.from(map.values());
  }, [firebaseCampaigns]);

  const publicAthletes = useMemo(() => {
    return athletes.filter(isPublicAthlete);
  }, [athletes]);

  const publicCampaigns = useMemo(() => {
    return campaigns.filter(
      (campaign) =>
        campaign.status !== "suspendue" &&
        campaign.status !== "archivée" &&
        campaign.status !== "archive" &&
        campaign.status !== "archivé"
    );
  }, [campaigns]);

  const goHome = () => navigate("/");
  const openAthletes = () => navigate("/athletes");
  const openCampaigns = () => navigate("/campaigns");
  const openSignup = () => navigate("/signup");
  const openLogin = () => navigate("/login");
  const openAdmin = () => navigate("/admin");
  const openDashboard = () => navigate("/dashboard");
  const openAthlete = (id) => navigate(`/athlete/${id}`);
  const openCampaign = (id) => navigate(`/campaign/${id}`);

  async function handleSetCurrentUser(value) {
    if (value === null) {
      await signOut(auth);
      setCurrentUser(null);
      navigate("/");
      return;
    }

    setCurrentUser(value);
  }

  return (
    <div className="min-h-screen bg-black">
      <Header
        currentUser={currentUser}
        setCurrentUser={handleSetCurrentUser}
        goHome={goHome}
        openLogin={openLogin}
        openSignup={openSignup}
        openCampaigns={openCampaigns}
        openAthletes={openAthletes}
        openAdmin={openAdmin}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              athletes={publicAthletes}
              campaigns={publicCampaigns}
              openAthletes={openAthletes}
              openCampaigns={openCampaigns}
              openSignup={openSignup}
              onOpenAthlete={openAthlete}
            />
          }
        />

        <Route
          path="/athletes"
          element={
            <AthletesPage
              athletes={publicAthletes}
              campaigns={publicCampaigns}
              onOpenAthlete={openAthlete}
              onOpenCampaign={openCampaign}
            />
          }
        />

        <Route
          path="/campaigns"
          element={
            <CampaignsPage
              campaigns={publicCampaigns}
              athletes={publicAthletes}
              onOpenCampaign={openCampaign}
              openSignup={openSignup}
            />
          }
        />

        <Route
          path="/campaign/:campaignId"
          element={
            <CampaignRoute
              campaigns={campaigns}
              athletes={publicAthletes}
              onOpenAthlete={openAthlete}
              openSignup={openSignup}
            />
          }
        />

        <Route
          path="/athlete/:athleteId"
          element={
            <AthleteRoute
              athletes={athletes}
              updates={updatesSeed || []}
              wallMessages={wallMessages || []}
              setWallMessages={setWallMessages}
              onOpenCampaign={openCampaign}
            />
          }
        />

        <Route path="/signup" element={<SignupView goBack={goHome} />} />

        <Route
          path="/login"
          element={
            <LoginView
              goBack={goHome}
              setCurrentUser={setCurrentUser}
              openAdmin={openAdmin}
              openDashboard={openDashboard}
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedDashboardRoute currentUser={currentUser} authLoading={authLoading}>
              <AthleteDashboard
                currentUser={currentUser}
                campaigns={campaigns}
                goHome={goHome}
                onOpenAthlete={openAthlete}
              />
            </ProtectedDashboardRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute currentUser={currentUser} authLoading={authLoading}>
              <AdminView
                athletes={athletes}
                campaigns={campaigns}
                wallMessages={wallMessages}
                setWallMessages={setWallMessages}
                goBack={goHome}
                onOpenAthlete={openAthlete}
              />
            </ProtectedAdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
