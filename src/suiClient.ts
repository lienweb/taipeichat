import { SuiClient } from "@mysten/sui/client";

export const suiClient = new SuiClient({
  url: import.meta.env.VITE_SUI_NETWORK,
});
