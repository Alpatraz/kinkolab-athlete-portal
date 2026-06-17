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
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
}

export function subscribeTransactionsByAthlete(athleteId, callback) {
  if (!athleteId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "fundTransactions"),
    where("athleteId", "==", athleteId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
}

export function subscribeTransactionsByCampaign(campaignId, callback) {
  if (!campaignId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "fundTransactions"),
    where("campaignId", "==", campaignId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
}
