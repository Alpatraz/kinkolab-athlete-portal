import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
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
import Footer from "./components/Footer";

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
  fundraisingEvents,
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
      fundraisingEvents={fundraisingEvents || []}
      wallMessages={wallMessages || []}
      setWallMessages={setWallMessages}
      goBack={() => navigate(-1)}
      onOpenCampaign={onOpenCampaign}
    />
  );
}

function CampaignRoute({
  campaigns,
  campaignsLoaded,
  athletes,
  participations,
  contributions,
  onOpenAthlete,
  openSignup,
}) {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const campaign = campaigns.find((item) => item.id === campaignId);

  if (!campaignsLoaded) {
    return <main className="min-h-screen bg-black p-8 text-white"><p className="text-xl font-black">Chargement de la campagne...</p></main>;
  }

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
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [participations, setParticipations] = useState([]);
  const [wallMessages, setWallMessages] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [athleteUpdates, setAthleteUpdates] = useState([]);
  const [fundraisingEvents, setFundraisingEvents] = useState([]);

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

        await setDoc(doc(db, "users", firebaseUser.uid), { lastLoginAt: serverTimestamp(), inactivityWarningSentAt: null }, { merge: true }).catch((error) => console.warn("Impossible de noter la connexion utilisateur", error));
        const loginAthleteIds = [...new Set([userData.athleteId, ...(userData.athleteIds || [])].filter(Boolean))];
        await Promise.all(loginAthleteIds.map((athleteId) => setDoc(doc(db, "athletes", athleteId), { lastLoginAt: serverTimestamp(), inactivityWarningSentAt: null }, { merge: true }).catch((error) => console.warn("Impossible de noter la connexion athlète", error))));

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
      setCampaignsLoaded(true);
    }, () => setCampaignsLoaded(true));

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

  useEffect(() => onSnapshot(collection(db, "athleteUpdates"), (snapshot) => {
    setAthleteUpdates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }), []);

  useEffect(() => onSnapshot(collection(db, "fundraisingEvents"), (snapshot) => {
    setFundraisingEvents(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }), []);

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
    return campaigns.filter((campaign) => ["active", "actif", "active"].includes(String(campaign.status || "active").toLowerCase()));
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
  campaigns={publicCampaigns}
  campaignsLoaded={campaignsLoaded}
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
              athletes={publicAthletes}
              campaigns={campaigns}
              participations={participations}
              updates={athleteUpdates.filter((item) => item.status === "approuvé" || item.status === "approved")}
              fundraisingEvents={fundraisingEvents.filter((item) => item.status === "approuvé" || item.status === "approved")}
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

        <Route
          path="/privacy"
          element={<PrivacyPolicyPage goBack={goHome} />}
        />

        <Route
          path="/terms"
          element={<TermsPage goBack={goHome} />}
        />

        <Route
          path="/eligibility"
          element={<EligibilityPage goBack={goHome} />}
        />

        <Route
          path="/transparency"
          element={<TransparencyPage goBack={goHome} />}
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer
        goHome={goHome}
        openAthletes={openAthletes}
        openCampaigns={openCampaigns}
        openSignup={openSignup}
        openPrivacy={() => navigate("/privacy")}
        openTerms={() => navigate("/terms")}
        openEligibility={() => navigate("/eligibility")}
        openTransparency={() => navigate("/transparency")}
      />
    </div>
  );
}
