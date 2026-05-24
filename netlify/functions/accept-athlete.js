const admin = require("firebase-admin");

function getAdminApp() {
  if (admin.apps.length) return admin.app();

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  }

  const serviceAccount = JSON.parse(rawKey);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateTemporaryPassword() {
  return `Kinko-${Math.random().toString(36).slice(2, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildAthlete(application, uid) {
  const athleteName =
    application.athleteName ||
    `${application.firstName || ""} ${application.lastName || ""}`.trim();

  const athleteId = slugify(athleteName || `athlete-${Date.now()}`);
  const campaignName = application.campaignTitle || application.campaignId || "Programme Athlètes Kinko";

  return {
    id: athleteId,
    userId: uid,

    name: athleteName,
    firstName: application.firstName || "",
    lastName: application.lastName || "",

    email: application.email || application.parentEmail || "",
    phone: application.phone || "",
    parentName: application.parentName || "",
    parentEmail: application.parentEmail || "",
    parentPhone: application.parentPhone || "",

    status: "accepté",
    avatar: "🥋",
    photoUrl: application.photo || "",

    countryFlag: "🇨🇦",
    province: application.province || "Québec",
    city: application.city || "",
    dojo: application.dojo || "À confirmer",
    coach: application.coach || "",
    discipline: application.discipline || "Arts martiaux",
    belt: application.belt || "À confirmer",
    athleteSocials: application.athleteSocials || "",
    familyName: application.familyName || "",

    campaignId: application.campaignId || "",
    program: campaignName,
    campaignBadge: campaignName,
    athleteLabel: "Athlète Kinko",

    goal: Number(application.desiredGoal || 0),
    raisedShop: 0,
    raisedOffline: 0,
    raisedSponsorship: 0,

    shopifyUrl: "https://kinkolab.com",
    sponsorUrl: "https://kinkolab.com",

    fundingPurpose:
      application.campaignReason ||
      "financer sa préparation, son déplacement, son hébergement et son équipement",

    bio:
      application.motivation ||
      `${athleteName} rejoint le Programme Athlètes KinkoLab.`,

    profitNote: `100 % des profits des ventes associées à ${athleteName} sont remis à ${athleteName}.`,

    supportSteps: [
      "Acheter un produit supporter",
      "Faire un don ou une commandite",
      "Partager la page",
      "Laisser un message d’encouragement",
    ],

    needs: [
      { label: "Transport", amount: 0 },
      { label: "Hébergement", amount: 0 },
      { label: "Inscription compétition", amount: 0 },
      { label: "Équipement", amount: 0 },
    ],

    steps: [
      {
        label: "Candidature acceptée",
        status: "completed",
        note: "Le profil athlète a été créé.",
        date: new Date().toISOString().slice(0, 10),
      },
      {
        label: "Campagne ouverte",
        status: "in_progress",
        note: "Le profil public est maintenant accessible.",
      },
    ],

    sponsors: [],
    fundingEvents: [],

    sourceApplicationId: application.id || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

exports.handler = async function (event) {
  try {
    getAdminApp();

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { applicationId } = body;

    if (!applicationId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "applicationId is required" }),
      };
    }

    const db = admin.firestore();
    const appRef = db.collection("applications").doc(applicationId);
    const appSnap = await appRef.get();

    if (!appSnap.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Application not found" }),
      };
    }

    const application = {
      id: appSnap.id,
      ...appSnap.data(),
    };

    if (application.status === "accepté" && application.athleteId) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          athleteId: application.athleteId,
          alreadyAccepted: true,
        }),
      };
    }

    const email = application.email || application.parentEmail;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No email found on application" }),
      };
    }

    const temporaryPassword = generateTemporaryPassword();

    let userRecord;

    try {
      userRecord = await admin.auth().createUser({
        email,
        password: temporaryPassword,
        displayName:
          application.athleteName ||
          `${application.firstName || ""} ${application.lastName || ""}`.trim(),
        emailVerified: false,
        disabled: false,
      });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, {
          password: temporaryPassword,
        });
      } else {
        throw error;
      }
    }

    const athlete = buildAthlete(application, userRecord.uid);

    await db.collection("athletes").doc(athlete.id).set(athlete, { merge: true });

    await appRef.update({
      status: "accepté",
      athleteId: athlete.id,
      userId: userRecord.uid,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        athleteId: athlete.id,
        userId: userRecord.uid,
        email,
        temporaryPassword,
      }),
    };
  } catch (error) {
    console.error("accept-athlete error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Internal server error",
      }),
    };
  }
};
