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
import { campaignsSeed } from "./data/demoData";

import EligibilityCriteriaPage from "./pages/EligibilityCriteriaPage";

import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import EligibilityPage from "./pages/EligibilityPage";
import TransparencyPage from "./pages/TransparencyPage";

function AthleteRoute({
  athletes,
  campaigns,
  participations,
  updates,
  wallMessages,
  setWallMessages,
  onOpenCampaign,
}) {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const athlete = athletes.find((item) => item.id === athleteId);

  if (!athlete) return <Navigate to="/athletes" replace />;

  return (
    <AthletePublicPage
      athlete={athlete}
      athletes={athletes}
      campaigns={campaigns}
      participations={participations || []}
      updates={updates || []}
      wallMessages={wallMessages || []}
      setWallMessages={setWallMessages}
      goBack={() => navigate(-1)}
      onOpenCampaign={onOpenCampaign}
    />
  );
}

function CampaignRoute({
  campaigns,
  athletes,
  participations,
  contributions,
  onOpenAthlete,
  openSignup,
}) {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const campaign = campaigns.find((item) => item.id === campaignId);

  if (!campaign) return <Navigate to="/campaigns" replace />;

  return (
    <CampaignDetailPage
      campaign={campaign}
      athletes={athletes}
      participations={participations}
      contributions={contributions}
      goBack={() => navigate("/campaigns")}
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

  if (!currentUser) return <Navigate to="/login" replace />;

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

  const [athletes, setAthletes] = useState([]);
  const [firebaseCampaigns, setFirebaseCampaigns] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [wallMessages, setWallMessages] = useState([]);
  const [contributions, setContributions] = useState([]);

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
      setAthletes(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      setFirebaseCampaigns(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "campaignParticipations"),
      (snapshot) => {
        setParticipations(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "contributions"),
    (snapshot) => {
      setContributions(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    }
  );

  return () => unsubscribe();
}, []);

  const campaigns = useMemo(() => {
  if (firebaseCampaigns.length > 0) {
    return firebaseCampaigns;
  }

  return campaignsSeed.map((campaign) => ({
    ...campaign,
    source: "seed",
  }));
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
        openDashboard={openDashboard}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
  athletes={publicAthletes}
  campaigns={publicCampaigns}
  participations={participations}
  contributions={contributions}
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
      participations={participations}
      contributions={contributions}
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
  participations={participations}
  contributions={contributions}
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
  participations={participations}
  contributions={contributions}
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
              campaigns={campaigns}
              participations={participations}
              updates={[]}
              wallMessages={wallMessages || []}
              setWallMessages={setWallMessages}
              onOpenCampaign={openCampaign}
            />
          }
        />

<Route
  path="/signup"
  element={
    <SignupView
      goBack={goHome}
      openEligibility={() => navigate("/criteres-admissibilite")}
    />
  }
/>
        
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
                participations={participations}
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

<Route
  path="/criteres-admissibilite"
  element={
    <EligibilityCriteriaPage
      goBack={goHome}
      openSignup={openSignup}
    />
  }
/>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
