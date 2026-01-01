import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

export const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
