// src/App.jsx

import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "./firebase";

import HomePage from "./pages/HomePage";
import LoginView from "./pages/LoginView";
import SignupView from "./pages/SignupView";
import AdminView from "./pages/AdminView";
import AthletePublicPage from "./pages/AthletePublicPage";
import CampaignsPage from "./pages/CampaignsPage";

import {
  athletesSeed,
  campaignsSeed,
  updatesSeed,
  wallMessagesSeed,
} from "./data/mock";

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

  if (!athlete) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black">Athlète introuvable</h1>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-2xl bg-white px-6 py-4 font-black text-black"
          >
            Retour accueil
          </button>
        </div>
      </main>
    );
  }

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

function AppContent() {
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [participations, setParticipations] = useState([]);

  const [wallMessages, setWallMessages] =
    useState(wallMessagesSeed);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "athletes"),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setAthletes(data);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "campaigns"),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setCampaigns(data);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "campaignParticipations"),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setParticipations(data);
      }
    );

    return () => unsubscribe();
  }, []);

  function openAdmin() {
    navigate("/admin");
  }

  function openAthlete(id) {
    navigate(`/athlete/${id}`);
  }

  function openCampaign(id) {
    navigate(`/campaign/${id}`);
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            athletes={athletes.length ? athletes : athletesSeed}
            campaigns={campaigns.length ? campaigns : campaignsSeed}
            openAthlete={openAthlete}
            openCampaign={openCampaign}
          />
        }
      />

      <Route
        path="/login"
        element={
          <LoginView
            goBack={() => navigate(-1)}
            setCurrentUser={setCurrentUser}
            openAdmin={openAdmin}
          />
        }
      />

      <Route
        path="/signup"
        element={
          <SignupView
            goBack={() => navigate(-1)}
          />
        }
      />

      <Route
        path="/admin"
        element={
          <AdminView
            athletes={athletes.length ? athletes : athletesSeed}
            campaigns={campaigns.length ? campaigns : campaignsSeed}
            wallMessages={wallMessages}
            setWallMessages={setWallMessages}
            goBack={() => navigate("/")}
            onOpenAthlete={openAthlete}
          />
        }
      />

      <Route
        path="/athlete/:athleteId"
        element={
          <AthleteRoute
            athletes={athletes.length ? athletes : athletesSeed}
            campaigns={campaigns.length ? campaigns : campaignsSeed}
            participations={participations}
            updates={updatesSeed || []}
            wallMessages={wallMessages || []}
            setWallMessages={setWallMessages}
            onOpenCampaign={openCampaign}
          />
        }
      />

      <Route
        path="/campaign/:campaignId"
        element={
          <CampaignsPage
            campaigns={campaigns.length ? campaigns : campaignsSeed}
            athletes={athletes.length ? athletes : athletesSeed}
            goBack={() => navigate(-1)}
            openAthlete={openAthlete}
          />
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
