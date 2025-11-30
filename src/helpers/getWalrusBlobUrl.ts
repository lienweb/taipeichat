import { AGGREGATOR_TESTNET } from "@/constant";

/**
 * 獲取 Walrus blob 的完整 URL
 * @param blobId - Walrus blob ID
 * @returns 完整的 blob URL
 */
export function getWalrusBlobUrl(blobId: string): string {
  if (!blobId) {
    return "";
  }
  return `${AGGREGATOR_TESTNET}/v1/blobs/${encodeURIComponent(blobId)}`;
}

