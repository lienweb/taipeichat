import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState, useEffect, useCallback } from "react";
import {
  createJoinChatroomTransaction,
  createSendMessageTransaction,
  findDefaultChatroomId,
  PACKAGE_ID,
  PROFILE_REGISTRY_ID,
} from "@/helpers/chatroom";
import { SuiObjectResponse } from "@mysten/sui/client";
import { useProfile } from "./useProfile";

export interface ChatroomMessage {
  id: string;
  sender: string;
  username: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  profileImage?: string;
}

export interface ChatroomParticipant {
  address: string;
  username: string;
  profileId: string;
  profileImage?: string;
}

export interface ChatroomData {
  id: string;
  name: string;
  participants: string[];
  createdAt: string;
  messageCount: number;
}

export const useChatroom = (chatroomId: string | null) => {
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { getUserProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatroomMessage[]>([]);
  const [participants, setParticipants] = useState<ChatroomParticipant[]>([]);
  const [chatroomData, setChatroomData] = useState<ChatroomData | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [resolvedChatroomId, setResolvedChatroomId] = useState<string | null>(
    chatroomId,
  );

  /**
   * Check if address is a participant
   */
  const checkIsParticipant = useCallback(
    async (address: string): Promise<boolean> => {
      if (!resolvedChatroomId) return false;

      try {
        const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::chatroom::is_participant`,
            arguments: [tx.object(resolvedChatroomId), tx.pure.address(address)],
          });

        const result = await client.devInspectTransactionBlock({
          sender: address,
          transactionBlock: tx,
        });

        if (result.results && result.results[0]?.returnValues) {
          const returnValue = result.results[0].returnValues[0];
          return returnValue[0][0] === 1;
        }

        return false;
      } catch (err) {
        console.error("Check participant error:", err);
        return false;
      }
    },
    [resolvedChatroomId, client],
  );

  /**
   * Get chatroom data
   */
  const fetchChatroomData = useCallback(async () => {
    if (!resolvedChatroomId) return;

    try {
      const object = await client.getObject({
        id: resolvedChatroomId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (object.data?.content && object.data.content.dataType === "moveObject") {
        const fields = object.data.content.fields as any;
        setChatroomData({
          id: resolvedChatroomId,
          name: fields.name,
          participants: fields.participants || [],
          createdAt: fields.created_at,
          messageCount: Number(fields.message_count) || 0,
        });
      }
    } catch (err) {
      console.error("Fetch chatroom data error:", err);
      setError("Failed to fetch chatroom data");
    }
  }, [chatroomId, client]);

  /**
   * Get participant profiles
   */
  const fetchParticipants = useCallback(async () => {
    if (!resolvedChatroomId || !chatroomData) return;

    try {
      const participantProfiles: ChatroomParticipant[] = [];

      for (const address of chatroomData.participants) {
        try {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::chatroom::get_participant_profile_id`,
            arguments: [tx.object(resolvedChatroomId), tx.pure.address(address)],
          });

          const result = await client.devInspectTransactionBlock({
            sender: address,
            transactionBlock: tx,
          });

          if (result.results && result.results[0]?.returnValues) {
            const returnValue = result.results[0].returnValues[0];
            if (returnValue[0] && returnValue[0].length > 0) {
              const profileIdValue = returnValue[0][0];
              const profileId =
                typeof profileIdValue === "string"
                  ? profileIdValue
                  : String(profileIdValue);
              const profile = await getUserProfile(address);

              if (profile) {
                participantProfiles.push({
                  address,
                  username: profile.username,
                  profileId,
                  profileImage: profile.imageBlobId,
                });
              } else {
                participantProfiles.push({
                  address,
                  username: address.slice(0, 6) + "..." + address.slice(-4),
                  profileId,
                });
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching participant ${address}:`, err);
        }
      }

      setParticipants(participantProfiles);
    } catch (err) {
      console.error("Fetch participants error:", err);
    }
  }, [resolvedChatroomId, chatroomData, client, getUserProfile]);

  /**
   * Fetch messages from chatroom
   */
  const fetchMessages = useCallback(async () => {
    if (!resolvedChatroomId || !chatroomData) return;

    try {
      const messageList: ChatroomMessage[] = [];
      const messageCount = chatroomData.messageCount;

      for (let i = 0; i < messageCount; i++) {
        try {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::chatroom::get_message`,
            arguments: [tx.object(resolvedChatroomId), tx.pure.u64(i)],
          });

          const result = await client.devInspectTransactionBlock({
            sender: "0x0",
            transactionBlock: tx,
          });

          if (result.results && result.results[0]?.returnValues) {
            const returnValue = result.results[0].returnValues[0];
            if (returnValue[0]) {
              const messageData = returnValue[0] as any;
              messageList.push({
                id: `${resolvedChatroomId}-${i}`,
                sender: messageData.sender,
                username: messageData.username,
                content: messageData.content,
                timestamp: new Date(Number(messageData.timestamp)),
                isOwn: false,
                profileImage: messageData.profile_image || messageData.profileImage || undefined,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching message ${i}:`, err);
        }
      }

      setMessages(messageList);
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  }, [resolvedChatroomId, chatroomData, client]);

  /**
   * Join chatroom
   */
  const joinChatroom = async (
    profileId: string,
    address: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!resolvedChatroomId) {
      return { success: false, error: "Chatroom ID is required" };
    }

    try {
      setIsLoading(true);
      setError(null);

      const tx = createJoinChatroomTransaction(resolvedChatroomId, profileId);
      
      // 設置 gas budget
      tx.setGasBudget(10000000);

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      await client.waitForTransaction({
        digest: result.digest,
      });

      await fetchChatroomData();
      await fetchParticipants();
      setIsParticipant(true);

      return {
        success: true,
      };
    } catch (err: any) {
      console.error("Join chatroom error:", err);
      const errorMsg = err.message || "Failed to join chatroom";
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send message
   */
  const sendMessage = async (
    profileId: string,
    content: string,
    address: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!resolvedChatroomId) {
      return { success: false, error: "Chatroom ID is required" };
    }

    if (!content.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }

    try {
      setIsLoading(true);
      setError(null);

      // 檢查用戶是否已加入聊天室
      const isParticipant = await checkIsParticipant(address);
      if (!isParticipant) {
        console.log("User is not a participant, attempting to join...");
        const joinResult = await joinChatroom(profileId, address);
        if (!joinResult.success) {
          return {
            success: false,
            error: "Please join the chatroom first before sending messages",
          };
        }
      }

      const tx = createSendMessageTransaction(resolvedChatroomId, profileId, content);
      
      // 設置 gas budget
      tx.setGasBudget(10000000);

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      const txResponse = await client.waitForTransaction({
        digest: result.digest,
        options: {
          showEvents: true,
        },
      });

      await fetchChatroomData();
      await fetchMessages();

      return {
        success: true,
      };
    } catch (err: any) {
      console.error("Send message error:", err);
      let errorMsg = err.message || "Failed to send message";
      
      // 解析更具體的錯誤信息
      if (err.message?.includes("MoveAbort") || err.message?.includes("0")) {
        errorMsg = "You must join the chatroom before sending messages";
      }
      
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Listen to new messages via events
   */
  useEffect(() => {
    if (!resolvedChatroomId) return;

    const interval = setInterval(async () => {
      await fetchChatroomData();
      await fetchMessages();
      await fetchParticipants();
    }, 5000);

    return () => clearInterval(interval);
  }, [resolvedChatroomId, fetchChatroomData, fetchMessages, fetchParticipants]);

  /**
   * Initialize chatroom data
   */
  useEffect(() => {
    if (resolvedChatroomId) {
      fetchChatroomData();
    }
  }, [resolvedChatroomId, fetchChatroomData]);

  /**
   * Update participant status when chatroom data changes
   */
  useEffect(() => {
    if (chatroomData && resolvedChatroomId) {
      fetchParticipants();
      fetchMessages();
    }
  }, [chatroomData, resolvedChatroomId]);

  return {
    messages,
    participants,
    chatroomData,
    isParticipant,
    isLoading,
    error,
    joinChatroom,
    sendMessage,
    checkIsParticipant,
    refresh: async () => {
      await fetchChatroomData();
      await fetchMessages();
      await fetchParticipants();
    },
  };
};

