{application.photo && (
  <img
    src={application.photo}
    alt={application.athleteName}
    className="mb-4 h-48 w-full rounded-2xl object-cover"
  />
)}

<div className="grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
  <p><b>Athlète :</b> {application.athleteName}</p>
  <p><b>Date de naissance :</b> {application.birthDate}</p>
  <p><b>Courriel athlète :</b> {application.email}</p>
  <p><b>Téléphone athlète :</b> {application.phone}</p>
  <p><b>Parent :</b> {application.parentName}</p>
  <p><b>Courriel parent :</b> {application.parentEmail}</p>
  <p><b>Téléphone parent :</b> {application.parentPhone}</p>
  <p><b>Ville :</b> {application.city}</p>
  <p><b>Province :</b> {application.province}</p>
  <p><b>Dojo :</b> {application.dojo}</p>
  <p><b>Coach :</b> {application.coach}</p>
  <p><b>Discipline :</b> {application.discipline}</p>
  <p><b>Ceinture :</b> {application.belt}</p>
  <p><b>Objectif :</b> {money(Number(application.desiredGoal || 0))}</p>
  <p><b>Réseaux sociaux :</b> {application.athleteSocials}</p>
  <p><b>Famille / groupe :</b> {application.familyName}</p>
</div>

<div className="mt-4">
  <label className="mb-2 block text-sm font-black text-zinc-700">
    Campagne associée
  </label>
  <select
    value={application.campaignId || ""}
    onChange={(event) => updateApplicationCampaign(application.id, event.target.value)}
    className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none"
  >
    {campaigns.map((campaign) => (
      <option key={campaign.id} value={campaign.id}>
        {campaign.title}
      </option>
    ))}
  </select>
</div>

<div className="mt-4 rounded-2xl bg-zinc-100 p-4">
  <p className="text-xs font-bold uppercase text-zinc-500">Pourquoi cette campagne ?</p>
  <p className="mt-1 text-sm leading-6 text-zinc-700">{application.campaignReason}</p>
</div>

<div className="mt-3 rounded-2xl bg-zinc-100 p-4">
  <p className="text-xs font-bold uppercase text-zinc-500">Motivation / histoire</p>
  <p className="mt-1 text-sm leading-6 text-zinc-700">{application.motivation}</p>
</div>
