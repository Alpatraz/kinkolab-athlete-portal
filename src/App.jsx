import { useState } from "react";

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

export default function App() {
  const [page, setPage] = useState({ name: "home" });
  const [currentUser, setCurrentUser] = useState(null);
  const [athletes] = useState(athletesSeed);
  const [campaigns] = useState(campaignsSeed);
  const [wallMessages, setWallMessages] = useState(wallSeed);

  const openAthlete = (id) => setPage({ name: "athlete", id });
  const openCampaign = (id) => setPage({ name: "campaign", id });
  const goHome = () => setPage({ name: "home" });
  const openAthletes = () => setPage({ name: "athletes" });
  const openCampaigns = () => setPage({ name: "campaigns" });
  const openSignup = () => setPage({ name: "signup" });
  const openLogin = () => setPage({ name: "login" });
  const openAdmin = () => setPage({ name: "admin" });

  const selectedAthlete = page.name === "athlete"
    ? athletes.find((athlete) => athlete.id === page.id)
    : null;

  const selectedCampaign = page.name === "campaign"
    ? campaigns.find((campaign) => campaign.id === page.id)
    : null;

  let content;

  if (page.name === "athletes") {
    content = (
      <AthletesPage
        athletes={athletes}
        campaigns={campaigns}
        onOpenAthlete={openAthlete}
        onOpenCampaign={openCampaign}
      />
    );
  } else if (page.name === "campaigns") {
    content = (
      <CampaignsPage
        campaigns={campaigns}
        athletes={athletes}
        onOpenCampaign={openCampaign}
        openSignup={openSignup}
      />
    );
  } else if (page.name === "campaign" && selectedCampaign) {
    content = (
      <CampaignDetailPage
        campaign={selectedCampaign}
        athletes={athletes}
        goBack={openCampaigns}
        onOpenAthlete={openAthlete}
        openSignup={openSignup}
      />
    );
  } else if (page.name === "athlete" && selectedAthlete) {
    content = (
      <AthletePublicPage
        athlete={selectedAthlete}
        updates={updatesSeed}
        wallMessages={wallMessages}
        setWallMessages={setWallMessages}
        goBack={openAthletes}
        onOpenCampaign={openCampaign}
      />
    );
  } else if (page.name === "signup") {
    content = <SignupView goBack={goHome} />;
  } else if (page.name === "login") {
    content = (
      <LoginView
        goBack={goHome}
        setCurrentUser={setCurrentUser}
        openAdmin={openAdmin}
      />
    );
  } else if (page.name === "admin") {
    content = (
      <AdminView
        athletes={athletes}
        campaigns={campaigns}
        wallMessages={wallMessages}
        setWallMessages={setWallMessages}
        goBack={goHome}
        onOpenAthlete={openAthlete}
      />
    );
  } else {
    content = (
      <HomePage
        athletes={athletes}
        campaigns={campaigns}
        openAthletes={openAthletes}
        openCampaigns={openCampaigns}
        openSignup={openSignup}
        onOpenAthlete={openAthlete}
      />
    );
  }

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

      {content}
    </div>
  );
}
