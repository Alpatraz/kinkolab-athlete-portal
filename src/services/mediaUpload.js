import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadAthleteMedia(file, athleteId, folder = "profile") {
  if (!file || !athleteId) {
    throw new Error("Fichier ou athlète manquant.");
  }

  const safeName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();

  const path = `athletes/${athleteId}/${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);

  return getDownloadURL(storageRef);
}
