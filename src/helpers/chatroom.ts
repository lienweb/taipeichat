import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_CONFIG } from "@/constant";
import { SuiClient } from "@mysten/sui/client";

export const { PACKAGE_ID, PROFILE_REGISTRY_ID, CLOCK_ID } = CONTRACT_CONFIG;

/**
 * Find the default chatroom ID by querying events or objects
 * @param client SuiClient instance
 * @returns Chatroom object ID or null
 */
export async function findDefaultChatroomId(
  client: SuiClient,
): Promise<string | null> {
  try {
    // Query ChatRoomCreated events to find the default chatroom
    const events = await client.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::chatroom::ChatRoomCreated`,
      },
      limit: 1,
      order: "descending",
    });

    if (events.data.length > 0) {
      const eventData = events.data[0].parsedJson as any;
      if (eventData?.room_id) {
        return eventData.room_id;
      }
    }

    // Fallback: Try to query objects by struct type
    // Note: This requires knowing the object ID or using a different approach
    // For now, return null and let the user set it in constant.ts
    return null;
  } catch (error) {
    console.error("Error finding chatroom ID:", error);
    return null;
  }
}

/**
 * Create a new chatroom transaction
 * @param name Chatroom name
 * @returns Transaction object
 */
export function createChatroomTransaction(name: string): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::chatroom::create_chatroom`,
    arguments: [
      tx.pure.string(name),
      tx.object(CLOCK_ID),
    ],
  });

  return tx;
}

/**
 * Create join chatroom transaction
 * @param chatroomId ChatRoom object ID
 * @param profileId Profile object ID
 * @returns Transaction object
 */
export function createJoinChatroomTransaction(
  chatroomId: string,
  profileId: string,
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::chatroom::join_chatroom`,
    arguments: [
      tx.object(chatroomId),
      tx.object(PROFILE_REGISTRY_ID),
      tx.object(profileId),
    ],
  });

  return tx;
}

/**
 * Create send message transaction
 * @param chatroomId ChatRoom object ID
 * @param profileId Profile object ID
 * @param content Message content
 * @returns Transaction object
 */
export function createSendMessageTransaction(
  chatroomId: string,
  profileId: string,
  content: string,
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::chatroom::send_message`,
    arguments: [
      tx.object(chatroomId),
      tx.object(PROFILE_REGISTRY_ID),
      tx.object(profileId),
      tx.pure.string(content),
      tx.object(CLOCK_ID),
    ],
  });

  return tx;
}
