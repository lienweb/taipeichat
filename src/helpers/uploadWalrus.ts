import { PUBLISHER_TESTNET, SUISCAN_URL_TESTNET } from "@/constant";
import { getAggregatorUrl } from "./getAggregatorUrl";

const uploadWalrus = (file: ArrayBuffer) => {
  return fetch(`${PUBLISHER_TESTNET}/v1/blobs?epochs=1`, {
    method: "PUT",
    body: file,
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json().then((info) => {
          return { data: info, status: "ok" };
        });
      } else {
        throw new Error("Something went wrong when storing the blob!");
      }
    })
    .catch(() => {
      return { data: null, status: "error" };
    });
};

const parseBlobInfo = (storage_info: any, media_type: any) => {
  let info;
  if ("alreadyCertified" in storage_info) {
    info = {
      status: "Already certified",
      blobId: storage_info.alreadyCertified.blobId,
      endEpoch: storage_info.alreadyCertified.endEpoch,
      suiRefType: "Previous Sui Certified Event",
      suiRef: storage_info.alreadyCertified.event.txDigest,
      suiBaseUrl: `${SUISCAN_URL_TESTNET}/tx`,
      blobUrl: getAggregatorUrl(
        `/v1/blobs/${storage_info.alreadyCertified.blobId}`,
        "service1",
      ),
      suiUrl: `${SUISCAN_URL_TESTNET}/object/${storage_info.alreadyCertified.event.txDigest}`,
      isImage: media_type.startsWith("image"),
    };
  } else if ("newlyCreated" in storage_info) {
    info = {
      status: "Newly created",
      blobId: storage_info.newlyCreated.blobObject.blobId,
      endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
      suiRefType: "Associated Sui Object",
      suiRef: storage_info.newlyCreated.blobObject.id,
      suiBaseUrl: `${SUISCAN_URL_TESTNET}/object`,
      blobUrl: getAggregatorUrl(
        `/v1/blobs/${storage_info.newlyCreated.blobObject.blobId}`,
        "service1",
      ),
      suiUrl: `${SUISCAN_URL_TESTNET}/object/${storage_info.newlyCreated.blobObject.id}`,
      isImage: media_type.startsWith("image"),
    };
  } else {
    return { status: "error", info: null };
  }
  return { status: "ok", info };
};

export { uploadWalrus, parseBlobInfo };
