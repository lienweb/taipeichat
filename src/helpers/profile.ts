import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_CONFIG } from "@/constant";

// 從 constant 導入配置
export const { PACKAGE_ID, PROFILE_REGISTRY_ID, CLOCK_ID } = CONTRACT_CONFIG;

/**
 * Create mint_profile transaction and transfer the NFT to the user
 * @param username 用戶名
 * @param bio 個人簡介
 * @param imageBlobId Walrus blob ID
 * @returns Transaction 對象
 */
export function createMintProfileTransaction(
  username: string,
  bio: string,
  imageBlobId: string,
): Transaction {
  const tx = new Transaction();

  // Call the mint_profile function
  const [profile] = tx.moveCall({
    target: `${PACKAGE_ID}::profile::mint_and_transfer_profile`,
    arguments: [
      tx.object(PROFILE_REGISTRY_ID), // registry
      tx.pure.string(username), // username
      tx.pure.string(bio), // bio
      tx.pure.string(imageBlobId), // image_blob_id
      tx.object(CLOCK_ID), // clock
    ],
  });

  return tx;
}

/**
 * 創建更新頭像的交易
 * @param profileId Profile NFT 的對象 ID
 * @param imageBlobId 新的 Walrus blob ID
 * @returns Transaction 對象
 */
export function createUpdateImageTransaction(
  profileId: string,
  imageBlobId: string,
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::profile::update_image`,
    arguments: [
      tx.object(profileId), // profile
      tx.pure.string(imageBlobId), // image_blob_id
    ],
  });

  return tx;
}

/**
 * 創建更新個人簡介的交易
 * @param profileId Profile NFT 的對象 ID
 * @param bio 新的個人簡介
 * @returns Transaction 對象
 */
export function createUpdateBioTransaction(
  profileId: string,
  bio: string,
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::profile::update_bio`,
    arguments: [
      tx.object(profileId), // profile
      tx.pure.string(bio), // bio
    ],
  });

  return tx;
}

