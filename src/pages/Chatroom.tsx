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
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
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
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { ProfileData } from "@/type";
import { AGGREGATOR_TESTNET, CONTRACT_CONFIG } from "@/constant";
import { useChatroom } from "@/hooks/useChatroom";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { createJoinChatroomTransaction, findDefaultChatroomId } from "@/helpers/chatroom";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  isRead?: boolean;
}

interface OnlineUser {
  name: string;
  address: string;
  avatarColor: string;
  imageUrl?: string;
}

const Chatroom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useCurrentAccount();
  const { disconnect } = useWallet();
  const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const profile = location.state?.profile as ProfileData | undefined;
  const profileId = location.state?.profileId as string | undefined;
  
  console.log("Chatroom initialized with:", {
    profile,
    profileId,
    locationState: location.state
  });
  
  const [username, setUsername] = useState(profile?.username || "");
  const [usernameError, setUsernameError] = useState("");
  const [avatarImage, setAvatarImage] = useState<string>(
    profile?.imageBlobId 
      ? `${AGGREGATOR_TESTNET}/v1/blobs/${profile.imageBlobId}`
      : ""
  );
  const [chatroomId, setChatroomId] = useState<string | null>(CONTRACT_CONFIG.CHATROOM_ID);
  const [hasJoinedChatroom, setHasJoinedChatroom] = useState(false);
  
  const { 
    messages: chatroomMessages, 
    participants: chatroomParticipants,
    sendMessage: sendChatroomMessage,
    refresh,
    isLoading: isChatroomLoading,
  } = useChatroom(chatroomId);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorsCount] = useState(Math.floor(Math.random() * 50) + 100);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatroomId) {
      const initChatroom = async () => {
        try {
          const defaultChatroomId = await findDefaultChatroomId(suiClient);
          if (defaultChatroomId) {
            setChatroomId(defaultChatroomId);
            console.log("Found default chatroom:", defaultChatroomId);
          } else {
            console.error("No default chatroom found.");
          }
        } catch (error) {
          console.error("Error finding chatroom:", error);
        }
      };
      initChatroom();
    }
  }, []);

  useEffect(() => {
    const joinChatroom = async () => {
      if (!chatroomId || !profileId || !account?.address || hasJoinedChatroom) {
        console.log("Skip joining chatroom:", {
          hasChatroomId: !!chatroomId,
          hasProfileId: !!profileId,
          hasAccount: !!account?.address,
          alreadyJoined: hasJoinedChatroom
        });
        return;
      }

      console.log("Attempting to join chatroom...");
      setHasJoinedChatroom(true);

      try {
        const tx = createJoinChatroomTransaction(chatroomId, profileId);
        tx.setGasBudget(10000000);
        const result = await signAndExecuteTransaction({ transaction: tx });
        
        console.log("✅ Joined chatroom successfully:", result);
        
        await fetchUsers();
        await refresh();
      } catch (error: any) {
        console.error("❌ Failed to join chatroom:", error);
        
        if (error?.message?.includes("ENotParticipant") || error?.message?.includes("already")) {
          console.log("Already a participant or duplicate join attempt");
        } else {
          console.error("Join chatroom error details:", error);
        }
        
        await fetchUsers();
        await refresh();
      }
    };

    joinChatroom();
  }, [chatroomId, profileId, account?.address, hasJoinedChatroom]);

  const fetchUsers = async () => {
    if (!chatroomId) return;

    console.log("Fetching chatroom participants...");
    try {
      const response = await suiClient.getObject({
        id: chatroomId,
        options: { showContent: true },
      });

      console.log("ChatRoom response:", response);

      if (response.data?.content?.dataType === "moveObject" && response.data.content.fields) {
        const fields = response.data.content.fields as any;
        console.log("ChatRoom fields:", fields);
        
        const participants = fields.participants || [];
        console.log("Participants:", participants);
        
        if (participants.length === 0) {
          console.log("No participants in chatroom");
          setOnlineUsers([]);
          return;
        }
        
        const participantProfiles = fields.participant_profiles?.fields || {};
        
        const users = await Promise.all(
          participants.map(async (address: string) => {
            try {
              const profileId = participantProfiles[address];
              
              if (!profileId) {
                console.warn(`No Profile ID for address ${address}`);
                return {
                  name: `User_${address.slice(0, 6)}`,
                  address: address,
                  avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
                };
              }
              
              const profileResponse = await suiClient.getObject({
                id: profileId,
                options: { showContent: true },
              });
              
              if (profileResponse.data?.content?.dataType === "moveObject") {
                const profileFields = profileResponse.data.content.fields as any;
                const imageBlobId = profileFields?.image_blob_id;
                
                return {
                  name: profileFields?.username || `User_${address.slice(0, 6)}`,
                  address: address,
                  avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
                  imageUrl: imageBlobId ? `${AGGREGATOR_TESTNET}/v1/blobs/${imageBlobId}` : undefined,
                };
              }
              
              return {
                name: `User_${address.slice(0, 6)}`,
                address: address,
                avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
              };
            } catch (error) {
              console.error(`Error fetching profile for ${address}:`, error);
              return {
                name: `User_${address.slice(0, 6)}`,
                address: address,
                avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
              };
            }
          })
        );
        
        console.log("Participants list updated:", users);
        setOnlineUsers(users);
      } else {
        console.error("ChatRoom does not exist or has invalid data.");
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
      setOnlineUsers([]);
    }
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
  }, [chatroomMessages]);

  const validateUsername = (value: string): boolean => {
    if (value.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    if (value.trim().length > 20) {
      setUsernameError("Username cannot exceed 20 characters");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (value.trim().length > 0) {
      validateUsername(value);
    } else {
      setUsernameError("");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      setTimeout(() => {
        setAvatarImage(reader.result as string);
        setIsUploadingAvatar(false);
      }, 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    console.log("handleSendMessage called");
    console.log("inputMessage:", inputMessage);
    console.log("account:", account?.address);
    console.log("profileId:", profileId);
    
    if (!inputMessage.trim() || !account?.address || !profileId) {
      console.log("Validation failed:", {
        hasInput: !!inputMessage.trim(),
        hasAccount: !!account?.address,
        hasProfileId: !!profileId
      });
      return;
    }

    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const content = inputMessage;
    setInputMessage("");

    try {
      console.log("Sending message:", content);
      const result = await sendChatroomMessage(profileId, content, account.address);
      
      if (result.success) {
        console.log("✅ Message sent successfully");
        await refresh();
      } else {
        console.error("❌ Failed to send message:", result.error);
        setInputMessage(content);
      }
    } catch (error) {
      console.error("❌ Send message error:", error);
      setInputMessage(content);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (e.target.value.trim()) {
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
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
              <p className="text-xs text-muted-foreground">{username}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt={username}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback
                      style={{
                        backgroundColor:
                          AVATAR_COLORS[
                            parseInt(
                              localStorage.getItem("selectedAvatar") || "1",
                            ) - 1
                          ],
                      }}
                      className="text-white font-semibold"
                    >
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
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
                onClick={()=>{disconnect(); navigate("/")}}
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
                  Online Users ({onlineUsers.length + 1})
                </h2>
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-3">
                {/* 當前用戶 */}
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      {avatarImage ? (
                        <img
                          src={avatarImage}
                          alt={username}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback
                          style={{
                            backgroundColor:
                              AVATAR_COLORS[
                                parseInt(
                                  localStorage.getItem("selectedAvatar") || "1",
                                ) - 1
                              ],
                          }}
                          className="text-white font-semibold"
                        >
                          {username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {username}
                    </div>
                  </div>
                </div>

                {/* 其他用戶 */}
                {onlineUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {user.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt={user.name}
                            className="object-cover"
                            onError={(e) => {
                              // 如果圖片載入失敗，隱藏 img 標籤，讓 fallback 顯示
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
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
                      <div className="text-xs text-muted-foreground font-mono">
                        {user.address}
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
                {chatroomMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} gap-3 animate-slide-up`}
                  >
                    {!msg.isOwn && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {msg.profileImage ? (
                          <img
                            src={`${AGGREGATOR_TESTNET}/v1/blobs/${msg.profileImage}`}
                            alt={msg.username}
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <AvatarFallback
                          style={{
                            backgroundColor: AVATAR_COLORS[0],
                          }}
                          className="text-white font-semibold text-sm"
                        >
                          {msg.username?.charAt(0).toUpperCase() || "?"}
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
                          {msg.isOwn ? "You" : msg.username}
                        </span>
                        <span className="text-xs opacity-50">
                          {msg.timestamp.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.content}</p>
                    </div>

                    {msg.isOwn && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {avatarImage ? (
                          <img
                            src={avatarImage}
                            alt={username}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback
                            style={{
                              backgroundColor:
                                AVATAR_COLORS[
                                  parseInt(
                                    localStorage.getItem("selectedAvatar") || "1",
                                  ) - 1
                                ],
                            }}
                            className="text-white font-semibold text-sm"
                          >
                            {username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
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
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                This is a frontend demo - messages are displayed locally only
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
