import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export function transactionTotal(transactions = []) {
  return transactions.reduce(
    (sum, transaction) => sum + Number(transaction.reservedAmount || 0),
    0
  );
}

export function contributionTotal(contributions = []) {
  return contributions.reduce(
    (sum, contribution) =>
      sum + Number(contribution.amountReserved || contribution.reservedAmount || 0),
    0
  );
}

export function subscribeTransactionsByFundingGroup(fundingGroupId, callback) {
  if (!fundingGroupId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "fundTransactions"),
    where("fundingGroupId", "==", fundingGroupId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

export function subscribeContributionsByFamily(familyId, callback) {
  if (!familyId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "contributions"),
    where("familyId", "==", familyId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

export function subscribeContributionsByAthlete(athleteId, callback) {
  if (!athleteId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "contributions"),
    where("athleteId", "==", athleteId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

export function subscribeContributionsByCampaign(campaignId, callback) {
  if (!campaignId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "contributions"),
    where("campaignId", "==", campaignId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}
