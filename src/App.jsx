import { useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";

import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AthletesPage from "./pages/AthletesPage";
import CampaignsPage from "./pages/CampaignsPage";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import AthletePublicPage from "./pages/AthletePublicPage";
import SignupView from "./pages/SignupView";
import LoginView from "./pages/LoginView";
import AdminView from "./pages/AdminView";

import {
  athletesSeed,
  campaignsSeed,
  updatesSeed,
  wallSeed,
} from "./data/demoData";

function AthleteRoute({
  athletes,
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
      <main className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl bg-zinc-950 p-8">
          <h1 className="text-3xl font-black">Athlète introuvable</h1>
          <button
            onClick={() => navigate("/athletes")}
            className="mt-6 rounded-2xl bg-white px-5 py-3 font-black text-black"
          >
            Retour aux athlètes
          </button>
        </div>
      </main>
    );
  }

  return (
    <AthletePublicPage
      athlete={athlete}
      updates={updates}
      wallMessages={wallMessages}
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
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl bg-zinc-950 p-8">
          <h1 className="text-3xl font-black">Campagne introuvable</h1>
          <button
            onClick={() => navigate("/campaigns")}
            className="mt-6 rounded-2xl bg-white px-5 py-3 font-black text-black"
          >
            Retour aux campagnes
          </button>
        </div>
      </main>
    );
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

export default function App() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [athletes] = useState(athletesSeed);
  const [campaigns] = useState(campaignsSeed);
  const [wallMessages, setWallMessages] = useState(wallSeed);

  const goHome = () => navigate("/");
  const openAthletes = () => navigate("/athletes");
  const openCampaigns = () => navigate("/campaigns");
  const openSignup = () => navigate("/signup");
  const openLogin = () => navigate("/login");
  const openAdmin = () => navigate("/admin");
  const openAthlete = (id) => navigate(`/athlete/${id}`);
  const openCampaign = (id) => navigate(`/campaign/${id}`);

  return (
    <div className="min-h-screen bg-black">
      <Header
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
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
              athletes={athletes}
              campaigns={campaigns}
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
              athletes={athletes}
              campaigns={campaigns}
              onOpenAthlete={openAthlete}
              onOpenCampaign={openCampaign}
            />
          }
        />

        <Route
          path="/campaigns"
          element={
            <CampaignsPage
              campaigns={campaigns}
              athletes={athletes}
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
              athletes={athletes}
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
              updates={updatesSeed}
              wallMessages={wallMessages}
              setWallMessages={setWallMessages}
              onOpenCampaign={openCampaign}
            />
          }
        />

        <Route
          path="/signup"
          element={<SignupView goBack={() => navigate(-1)} />}
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
          path="/admin"
          element={
            <AdminView
              athletes={athletes}
              campaigns={campaigns}
              wallMessages={wallMessages}
              setWallMessages={setWallMessages}
              goBack={() => navigate(-1)}
              onOpenAthlete={openAthlete}
            />
          }
        />

        <Route
          path="*"
          element={
            <main className="min-h-screen bg-black p-8 text-white">
              <div className="mx-auto max-w-4xl rounded-3xl bg-zinc-950 p-8">
                <h1 className="text-3xl font-black">Page introuvable</h1>
                <button
                  onClick={goHome}
                  className="mt-6 rounded-2xl bg-white px-5 py-3 font-black text-black"
                >
                  Retour à l’accueil
                </button>
              </div>
            </main>
          }
        />
      </Routes>
    </div>
  );
}
