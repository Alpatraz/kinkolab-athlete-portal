import { useState } from "react";

import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AthletesPage from "./pages/AthletesPage";
import CampaignsPage from "./pages/CampaignsPage";
import AthletePublicPage from "./pages/AthletePublicPage";

import {
  athletesSeed,
  campaignsSeed,
} from "./data/demoData";

export default function App() {
  const [page, setPage] = useState("home");

  const openAthletes = () => setPage("athletes");
  const openCampaigns = () => setPage("campaigns");
  const goHome = () => setPage("home");

  const athlete = athletesSeed[0];

  return (
    <div className="min-h-screen bg-black">
      <Header
        goHome={goHome}
        openAthletes={openAthletes}
        openCampaigns={openCampaigns}
        openSignup={() => {}}
      />

      {page === "home" && (
        <HomePage
          athletes={athletesSeed}
          campaigns={campaignsSeed}
          openAthletes={openAthletes}
          openCampaigns={openCampaigns}
          openSignup={() => {}}
        />
      )}

      {page === "athletes" && (
        <AthletesPage athletes={athletesSeed} />
      )}

      {page === "campaigns" && (
        <CampaignsPage campaigns={campaignsSeed} />
      )}

      {page === "athlete" && (
        <AthletePublicPage athlete={athlete} />
      )}
    </div>
  );
}
