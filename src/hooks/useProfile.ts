import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";
import {
  createMintProfileTransaction,
  createUpdateBioTransaction,
  createUpdateImageTransaction,
  PACKAGE_ID,
  PROFILE_REGISTRY_ID,
} from "@/helpers/profile";
import { SuiObjectResponse } from "@mysten/sui/client";
import { ProfileData } from "@/type";

export const useProfile = () => {
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mint Profile NFT
   */
  const mintProfile = async (
    username: string,
    bio: string,
    imageBlobId: string,
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const tx = createMintProfileTransaction(username, bio, imageBlobId);

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("✅ Profile minted successfully:", result);

      const txResponse = await client.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });

      // Find the newly created Profile object from objectChanges
      const createdProfile = txResponse.objectChanges?.find(
        (change) =>
          change.type === "created" && change.objectType.includes("Profile"),
      );

      // 提取 Profile ID
      let profileId: string | undefined;
      if (createdProfile && createdProfile.type === "created") {
        profileId = createdProfile.objectId;
      }

      return {
        success: true,
        digest: result.digest,
        profileId,
        result: txResponse,
      };
    } catch (err: any) {
      console.error("❌ Mint profile error:", err);
      setError(err.message || "Failed to mint profile");
      return {
        success: false,
        error: err.message || "Failed to mint profile",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update Profile image
   */
  const updateProfileImage = async (profileId: string, imageBlobId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const tx = createUpdateImageTransaction(profileId, imageBlobId);

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("✅ Profile image updated successfully:", result);

      // Wait for transaction confirmation
      await client.waitForTransaction({
        digest: result.digest,
      });

      return {
        success: true,
        digest: result.digest,
        result,
      };
    } catch (err: any) {
      console.error("❌ Update profile image error:", err);
      setError(err.message || "Failed to update profile image");
      return {
        success: false,
        error: err.message || "Failed to update profile image",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update Profile bio
   */
  const updateProfileBio = async (profileId: string, bio: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const tx = createUpdateBioTransaction(profileId, bio);

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("✅ Profile bio updated successfully:", result);

      // Wait for transaction confirmation
      await client.waitForTransaction({
        digest: result.digest,
      });

      return {
        success: true,
        digest: result.digest,
        result,
      };
    } catch (err: any) {
      console.error("❌ Update profile bio error:", err);
      setError(err.message || "Failed to update profile bio");
      return {
        success: false,
        error: err.message || "Failed to update profile bio",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if the address already has a Profile
   */
  const hasProfile = async (address: string): Promise<boolean> => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::profile::has_profile`,
        arguments: [tx.object(PROFILE_REGISTRY_ID), tx.pure.address(address)],
      });

      const result = await client.devInspectTransactionBlock({
        sender: address,
        transactionBlock: tx,
      });

      // Parse the return value
      if (result.results && result.results[0]?.returnValues) {
        const returnValue = result.results[0].returnValues[0];
        return returnValue[0][0] === 1;
      }

      return false;
    } catch (err) {
      console.error("❌ Check profile error:", err);
      return false;
    }
  };

  /**
   * Get the user's Profile object
   */
  const getUserProfile = async (
    address: string,
  ): Promise<ProfileData | null> => {
    try {
      // 查詢用戶擁有的所有對象
      const objects = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${PACKAGE_ID}::profile::Profile`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (objects.data.length === 0) {
        return null;
      }

      // Get the first Profile object's detailed information
      const profileObj = objects.data[0] as SuiObjectResponse;
      const content = profileObj.data?.content;

      if (content && content.dataType === "moveObject") {
        const fields = content.fields as any;
        return {
          id: profileObj.data?.objectId,
          username: fields.username,
          bio: fields.bio,
          imageBlobId: fields.image_blob_id,
          owner: fields.owner,
          createdAt: fields.created_at,
        };
      }

      return null;
    } catch (err) {
      console.error("❌ Get user profile error:", err);
      return null;
    }
  };

  return {
    mintProfile,
    updateProfileImage,
    updateProfileBio,
    hasProfile,
    getUserProfile,
    isLoading,
    error,
  };
};
