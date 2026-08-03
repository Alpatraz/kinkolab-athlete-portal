import type { Config } from "@netlify/functions";
import { runScheduledWisePayouts } from "./wise-payouts.mts";

export default async () => {
  try {
    return Response.json(await runScheduledWisePayouts());
  } catch (error) {
    console.error("wise-payout-scheduler", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Wise payout scheduler failed" },
      { status: 500 },
    );
  }
};

export const config: Config = { schedule: "20 14 * * *" };
