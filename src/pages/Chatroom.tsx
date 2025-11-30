import { PageLoader } from "@/components/PageLoader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AVATAR_COLORS } from "@/constant";
import { useWallet } from "@/hooks/useWallet";
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import {
  ArrowRight,
  Check,
  CheckCircle,
  LogOut,
  Send,
  User,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { suiClient as importedSuiClient } from "@/suiClient";

interface Message {
  id: string;
  sender: string;
  username: string;
  content: string;
  timestamp: number;
  isOwn: boolean;
  isRead?: boolean;
  profileImage?: string;
}

interface OnlineUser {
  name: string;
  address: string;
  avatarColor: string;
}

// 合約配置
const CONTRACT_CONFIG = {
  PACKAGE_ID: "0x4e2a8c66fe62c78e2ff9005a5616e014bb34e3d7fd3a4b687403177e925d70d7",
  PROFILE_REGISTRY_ID: "0xb3ddbc6182a5612196fd558eda0503482da21c14d3787b19a8b3354f64df3fbc",
  PUBLISHER_ID: "0x5255709e7cdac8fc5355de61d22add14bb749adf3af6b47bfa0afd1e4ac668a9",
  DISPLAY_ID: "0x86d8903b2d811a9e6352ec39fb2307193b0daffb99d9ab2a758655b383a56727",
  UPGRADE_CAP_ID: "0x99b86cd90b062031f95e60205e91a3011170ff6edb122b0a8f57cf3d4253cafc",
  CLOCK_ID: "0x6",
};

const PACKAGE_ID = CONTRACT_CONFIG.PACKAGE_ID;
const CHATROOM_ID = "0xf745b325aef9528f0ddaad059e75a203d068de515690ba14f19b614bb2227012";
const PROFILE_REGISTRY_ID = CONTRACT_CONFIG.PROFILE_REGISTRY_ID;

const Chatroom = () => {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { disconnect } = useWallet();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [profileId, setProfileId] = useState<string>("");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const suiClient = importedSuiClient;

  // 添加調試日誌到聊天框
  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `[DEBUG ${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 從合約讀取訊息
  const fetchMessages = async () => {
    if (!CHATROOM_ID) {
      addDebugLog("❌ CHATROOM_ID 為空！");
      return;
    }

    try {
      const response = await suiClient.getObject({
        id: CHATROOM_ID,
        options: { showContent: true },
      });

      if (response.data?.content?.dataType === "moveObject") {
        const fields = response.data.content.fields as any;
        const messageCount = parseInt(fields.message_count || "0");
        
        // 只顯示訊息總數
        addDebugLog(`📊 訊息總數: ${messageCount}`);

        const messagesData: Message[] = [];

        // 讀取所有訊息（從動態欄位中）
        for (let i = 0; i < messageCount; i++) {
          try {
            const messageResponse = await suiClient.getDynamicFieldObject({
              parentId: CHATROOM_ID,
              name: {
                type: `${PACKAGE_ID}::chatroom::MessageKey`,
                value: { index: `${i}` }
              },
            });

            if (messageResponse.data?.content?.dataType === "moveObject") {
              const msgFields = messageResponse.data.content.fields as any;
              const value = msgFields.value;
              
              // 只顯示有訊息的
              addDebugLog(`💬 訊息 ${i}: ${value.content}`);
              
              messagesData.push({
                id: i.toString(),
                sender: value.sender,
                username: value.username || `User_${value.sender.slice(0, 6)}`,
                content: value.content,
                timestamp: parseInt(value.timestamp),
                isOwn: value.sender === account?.address,
                profileImage: value.profile_image || "",
              });
            }
          } catch (error: any) {
            // 不顯示讀取失敗的訊息
            console.error(`讀取訊息 ${i} 失敗:`, error);
          }
        }

        setMessages(messagesData);
      }
    } catch (error: any) {
      addDebugLog(`❌ 讀取訊息失敗: ${error.message}`);
    }
  };

  // 檢查並加入聊天室
  const checkAndJoinChatroom = async () => {
    if (!account?.address) return;

    try {
      console.log("檢查用戶是否已加入聊天室...");
      
      const response = await suiClient.getObject({
        id: CHATROOM_ID,
        options: { showContent: true },
      });

      if (response.data?.content?.dataType === "moveObject") {
        const fields = response.data.content.fields as any;
        const participants = fields.participants || [];
        
        // 檢查用戶是否已經是參與者
        const isParticipant = participants.includes(account.address);
        
        if (!isParticipant) {
          console.log("用戶尚未加入聊天室，準備加入...");
          
          // 獲取用戶的 Profile
          const registryResponse = await suiClient.getObject({
            id: PROFILE_REGISTRY_ID,
            options: { showContent: true },
          });

          if (registryResponse.data?.content?.dataType === "moveObject") {
            const registryFields = registryResponse.data.content.fields as any;
            const profiles = registryFields.profiles?.fields?.contents || [];
            
            let userProfileId = "";
            for (const item of profiles) {
              if (item.key === account.address) {
                userProfileId = item.value;
                setProfileId(userProfileId);
                break;
              }
            }

            if (userProfileId) {
              // 建立加入聊天室的交易
              const tx = new Transaction();
              
              tx.moveCall({
                target: `${PACKAGE_ID}::chatroom::join_chatroom`,
                arguments: [
                  tx.object(CHATROOM_ID),
                  tx.object(PROFILE_REGISTRY_ID),
                  tx.object(userProfileId),
                ],
              });

              // 執行交易
              signAndExecuteTransaction(
                {
                  transaction: tx,
                },
                {
                  onSuccess: (result) => {
                    console.log("成功加入聊天室:", result);
                    toast.success("已加入聊天室");
                    // 重新獲取參與者列表
                    setTimeout(() => {
                      fetchUsers();
                    }, 1000);
                  },
                  onError: (error) => {
                    console.error("加入聊天室失敗:", error);
                    toast.error("加入聊天室失敗");
                  },
                }
              );
            } else {
              console.log("未找到用戶 Profile，請先創建 Profile");
              toast.error("請先在個人資料頁面創建您的 Profile");
            }
          }
        } else {
          console.log("用戶已經是聊天室參與者");
          
          // 獲取用戶的 Profile ID
          const participantProfiles = fields.participant_profiles?.fields?.contents || [];
          for (const item of participantProfiles) {
            if (item.key === account.address) {
              setProfileId(item.value);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("檢查聊天室狀態失敗:", error);
    }
  };

  // 獲取所有註冊用戶（從 ProfileRegistry）
  const fetchUsers = async () => {
    console.log("=== 開始獲取所有註冊用戶 ===");
    console.log("PROFILE_REGISTRY_ID:", PROFILE_REGISTRY_ID);
    try {
      const response = await suiClient.getObject({
        id: PROFILE_REGISTRY_ID,
        options: { showContent: true },
      });

      console.log("ProfileRegistry 回應:", response);

      if (response.data?.content?.dataType === "moveObject" && response.data.content.fields) {
        const fields = response.data.content.fields as any;
        console.log("ProfileRegistry 欄位:", fields);
        
        // 從 profiles Table 獲取所有 Profile
        const profilesTable = fields.profiles?.fields?.contents || [];
        console.log("註冊用戶數:", profilesTable.length);
        
        if (profilesTable.length === 0) {
          console.log("目前沒有註冊用戶");
          setOnlineUsers([]);
          return;
        }
        
        // 獲取每個用戶的 Profile 資訊
        const users = await Promise.all(
          profilesTable.map(async (item: any, index: number) => {
            try {
              const address = item.key;
              const profileId = item.value;
              
              // 讀取 Profile 物件
              const profileResponse = await suiClient.getObject({
                id: profileId,
                options: { showContent: true },
              });
              
              if (profileResponse.data?.content?.dataType === "moveObject") {
                const profileFields = profileResponse.data.content.fields as any;
                
                return {
                  name: profileFields?.username || `User_${address.slice(0, 6)}`,
                  address: address,
                  avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length]
                };
              }
              
              return {
                name: `User_${address.slice(0, 6)}`,
                address: address,
                avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length]
              };
            } catch (error) {
              console.error(`獲取 Profile 失敗:`, error);
              return null;
            }
          })
        );
        
        // 過濾掉失敗的項目
        const validUsers = users.filter(user => user !== null) as OnlineUser[];
        console.log("用戶列表已更新:", validUsers);
        setOnlineUsers(validUsers);
      } else {
        console.error("ProfileRegistry does not exist or has invalid data.");
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error("獲取用戶列表失敗:", error);
      setOnlineUsers([]);
    }
  };

  // 初始化：檢查並加入聊天室，然後獲取數據
  useEffect(() => {
    if (account?.address) {
      checkAndJoinChatroom();
    }
  }, [account?.address]);

  // 初始化：立即獲取用戶列表和訊息（不需要錢包連接）
  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, []);

  // 定期更新訊息和用戶列表
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      fetchUsers();
    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, [account?.address]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    setIsTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 先在本地顯示訊息（樂觀 UI 更新）
    const tempMessage: Message = {
      id: Date.now().toString(),
      sender: account?.address || "local",
      username: "You",
      content: inputMessage,
      timestamp: Date.now(),
      isOwn: true,
      profileImage: "",
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");

    // 如果沒有連接錢包，只顯示本地訊息
    if (!account?.address) {
      toast.info("訊息僅在本地顯示（未連接錢包）");
      return;
    }

    // 如果有連接錢包，嘗試發送到合約
    setIsSending(true);

    try {
      // 先獲取用戶的 Profile ID
      let userProfileId = profileId;
      
      if (!userProfileId) {
        const roomResponse = await suiClient.getObject({
          id: CHATROOM_ID,
          options: { showContent: true },
        });

        if (roomResponse.data?.content?.dataType === "moveObject") {
          const fields = roomResponse.data.content.fields as any;
          const participantProfiles = fields.participant_profiles?.fields?.contents || [];
          
          // 尋找當前用戶的 Profile ID
          for (const item of participantProfiles) {
            if (item.key === account.address) {
              userProfileId = item.value;
              setProfileId(userProfileId);
              break;
            }
          }
        }
      }

      if (!userProfileId) {
        toast.warning("訊息僅在本地顯示（尚未加入聊天室）");
        setIsSending(false);
        return;
      }

      // 建立交易
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::chatroom::send_message`,
        arguments: [
          tx.object(CHATROOM_ID),
          tx.object(PROFILE_REGISTRY_ID),
          tx.object(userProfileId),
          tx.pure.string(messageToSend),
          tx.object("0x6"), // Clock object
        ],
      });

      // 執行交易
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("訊息發送成功:", result);
            toast.success("訊息已上鏈");
            // 立即更新訊息列表
            setTimeout(() => fetchMessages(), 1000);
          },
          onError: (error) => {
            console.error("訊息發送失敗:", error);
            toast.error("上鏈失敗，訊息僅在本地顯示");
          },
        }
      );
    } catch (error) {
      console.error("發送訊息錯誤:", error);
      toast.error("上鏈失敗，訊息僅在本地顯示");
    } finally {
      setIsSending(false);
    }
  };
ㄔㄛ
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (e.target.value.trim()) {
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background animate-fade-slide-in">
      {/* TODO: layout navbar component */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Web3 Chatroom
              </h1>
              <p className="text-xs text-muted-foreground">
                {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Not connected'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    style={{
                      backgroundColor: AVATAR_COLORS[0],
                    }}
                    className="text-white font-semibold"
                  >
                    {account?.address ? account.address.charAt(2).toUpperCase() : 'K'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={disconnect}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          <Card className="lg:col-span-1 p-4 bg-card border h-full">
            <div className="mb-4 pb-3 border-b border-border space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">
                  Online Users ({onlineUsers.length})
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                All Visitors: {onlineUsers.length}
              </p>
            </div>
            <ScrollArea className="h-[calc(100%-80px)]">
              <div className="space-y-3">
                {/* 所有註冊用戶 */}
                {onlineUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          style={{ backgroundColor: user.avatarColor }}
                          className="text-white font-semibold"
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="lg:col-span-3 bg-card border flex flex-col h-full">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} gap-3 animate-slide-up`}
                  >
                    {/* 左側頭像 - 非自己的訊息 */}
                    {!msg.isOwn && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback
                          style={{
                            backgroundColor:
                              msg.sender === "System"
                                ? "hsl(200, 100%, 40%)"
                                : AVATAR_COLORS[0],
                          }}
                          className="text-white font-semibold text-sm"
                        >
                          {msg.sender === "System"
                            ? "S"
                            : msg.sender.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] rounded-2xl p-4 ${
                        msg.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs opacity-70">
                          {msg.isOwn
                            ? "You"
                            : msg.username || `${msg.sender.slice(0, 6)}...${msg.sender.slice(-4)}`}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.content}</p>

                      {/* 已讀/未讀狀態 - 只顯示在自己的訊息 */}
                      {msg.isOwn && (
                        <div className="flex justify-end mt-1">
                          {msg.isRead ? (
                            // 雙勾 - 已讀
                            <div className="flex items-center gap-0.5">
                              <Check
                                className="h-3 w-3 opacity-70"
                                strokeWidth={3}
                              />
                              <Check
                                className="h-3 w-3 opacity-70 -ml-2"
                                strokeWidth={3}
                              />
                            </div>
                          ) : (
                            // 單勾 - 已發送但未讀
                            <Check
                              className="h-3 w-3 opacity-50"
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 右側頭像 - 自己的訊息 */}
                    {msg.isOwn && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback
                          style={{
                            backgroundColor: AVATAR_COLORS[0],
                          }}
                          className="text-white font-semibold text-sm"
                        >
                          {msg.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {/* 顯示調試日誌 */}
                {debugLogs.map((log, index) => (
                  <div key={`debug-${index}`} className="flex justify-start mb-2">
                    <div className="max-w-[90%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                      <p className="text-xs font-mono text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">
                        {log}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[70%] rounded-2xl p-4 bg-muted text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 rounded-full bg-primary animate-pulse"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-primary animate-pulse"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-primary animate-pulse"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-background border-input focus:border-primary"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isSending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
