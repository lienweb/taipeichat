import { AGGREGATOR_TESTNET } from "@/constant";

const downloadWalrus = async (blobId: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const response = await fetch(`${AGGREGATOR_TESTNET}/v1/blobs/${blobId}`, {
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!response.ok) {
    return null;
  }
  return await response.arrayBuffer();
};

export default downloadWalrus;
