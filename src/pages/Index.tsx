import { PageLoader } from "@/components/PageLoader";
import { RegistrationStepper } from "@/components/RegistrationStepper";
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
import { parseBlobInfo, uploadWalrus } from "@/helpers/uploadWalrus";
import { useProfile } from "@/hooks/useProfile";
import {
  ConnectButton,
  ConnectModal,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Loader2,
  LogOut,
  Send,
  User,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
}

const Index = () => {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { currentWallet, connectionStatus, isConnected } = useCurrentWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mintProfile, isLoading: isMinting } = useProfile();
  const [registrationStep, setRegistrationStep] = useState<
    "wallet" | "username" | "confirm" | "complete"
  >("wallet");
  const [username, setUsername] = useState("");
  const [open, setOpen] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState("");
  const [avatar, setAvatar] = useState<{ blobId: string; url: string } | null>(
    null,
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [onlineUsers] = useState<OnlineUser[]>([
    { name: "Alice", address: "0x742d...0bEb", avatarColor: AVATAR_COLORS[1] },
    { name: "Bob", address: "0x8ba1...BA72", avatarColor: AVATAR_COLORS[2] },
    {
      name: "Charlie",
      address: "0xE118...882d",
      avatarColor: AVATAR_COLORS[3],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorsCount] = useState(Math.floor(Math.random() * 50) + 100); // Simulated visitors count (100-149)
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!account) {
      setRegistrationStep("wallet");
    }
  }, [account]);

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

  const handleNextStep = () => {
    if (validateUsername(username)) {
      setRegistrationStep("confirm");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image size must be less than 2MB");
      }

      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar((pre) => ({ ...pre, url: reader.result as string }));
      };
      reader.readAsDataURL(file);

      const buffer = await file.arrayBuffer();
      const blobInfo = await uploadWalrus(buffer);
      if (!blobInfo.data) {
        throw new Error(`Failed to upload to Walrus: ${blobInfo.status}`);
      }

      const { status, info } = parseBlobInfo(blobInfo.data, file.type);
      if (status === "error" || !info) {
        throw new Error("Failed to parse blob info");
      }
      setAvatar((pre) => ({ ...pre, blobId: info.blobId }));
      setIsUploadingAvatar(false);
      console.log("handleAvatarUpload", info.blobId);
    } catch (error) {
      console.error("Avatar upload error", error);
      alert(error);
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      if (!avatar?.blobId) {
        alert("Please upload an avatar first");
        return;
      }

      console.log("🚀 Starting profile minting...");
      console.log("Username:", username);
      console.log("Bio:", "TaipeiChat user"); // 可以添加 bio 輸入框
      console.log("Avatar Blob ID:", avatar.blobId);

      const result = await mintProfile(
        username,
        "TaipeiChat user", // 預設 bio，可以之後修改
        avatar.blobId,
      );

      if (result.success) {
        console.log("✅ Profile minted successfully!");
        console.log("Transaction Digest:", result.digest);
        console.log("Profile ID:", result.profileId);

        const welcomeMsg: Message = {
          id: Date.now().toString(),
          sender: "System",
          content: `Welcome ${username} to the chatroom! Your profile has been created on-chain.`,
          timestamp: new Date(),
          isOwn: false,
          isRead: false,
        };
        setMessages([welcomeMsg]);

        // 導航到聊天室
        navigate("/chatroom");
        setRegistrationStep("complete");
      } else {
        console.error("❌ Failed to mint profile:", result.error);
        alert(`Failed to create profile: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      alert(`Error: ${error}`);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !account.address) return;

    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: account.address,
      content: inputMessage,
      timestamp: new Date(),
      isOwn: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // 模擬訊息發送後立即標記為已讀（延遲 1.5 秒）
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, isRead: true } : msg,
        ),
      );
    }, 1500);

    setTimeout(() => {
      const echoMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "Echo Bot",
        content: `Received: ${inputMessage}`,
        timestamp: new Date(),
        isOwn: false,
        isRead: false,
      };
      setMessages((prev) => [...prev, echoMessage]);
    }, 1000);
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
  // TODO: login userflow
  const handleLoginBtn = () => {};

  if (isLoading) {
    return <PageLoader />;
  }

  // FIXME: routing /profile
  if (registrationStep === "wallet") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto animate-fade-slide-in ">
          <Button onClick={handleLoginBtn}>Login</Button>
          <RegistrationStepper currentStep={1} />

          <Card className="w-full p-8 bg-card border shadow-sm">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-primary">TaipeiChat</h1>
                <p className="text-muted-foreground">
                  Connect your wallet to get started
                </p>
              </div>
              <ConnectButton />
              <Button
                className="w-full h-12 border-2 border-primary text-white"
                onClick={() => setRegistrationStep("username")}
              >
                click to continue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (registrationStep === "username") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto animate-fade-slide-in">
          <Button onClick={handleLoginBtn}>Login</Button>
          <RegistrationStepper currentStep={2} />

          <Card className="w-full p-8 bg-card border shadow-sm">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Username</h1>
                <p className="text-muted-foreground">
                  Please enter your username
                </p>
                <div className="text-xs text-primary bg-primary/10 rounded-lg p-2 font-mono flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {account.address.slice(0, 6)}...
                  {account.address.slice(-4)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Enter username"
                    className={`bg-background border-input focus:border-primary h-12 ${
                      usernameError
                        ? "border-destructive focus:border-destructive"
                        : ""
                    }`}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      username.trim().length >= 3 &&
                      !isUploadingAvatar &&
                      handleNextStep()
                    }
                  />
                  {usernameError && (
                    <p className="text-xs text-destructive">{usernameError}</p>
                  )}
                  {!usernameError &&
                    username.trim().length > 0 &&
                    username.trim().length < 3 && (
                      <p className="text-xs text-muted-foreground">
                        {3 - username.trim().length} more character
                        {3 - username.trim().length > 1 ? "s" : ""} needed
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {avatar?.url ? (
                        <img
                          src={avatar.url}
                          alt="Avatar preview"
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-muted text-foreground">
                          {username ? username.charAt(0).toUpperCase() : "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar || !!avatar?.blobId}
                        className="w-full"
                      >
                        {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 2MB, image files only
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleNextStep}
                  disabled={
                    username.trim().length < 3 ||
                    isUploadingAvatar ||
                    !avatar?.blobId
                  }
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                >
                  Next
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (registrationStep === "confirm") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto animate-fade-slide-in">
          <Button onClick={handleLoginBtn}>Login</Button>
          <RegistrationStepper currentStep={3} />

          <Card className="w-full p-8 bg-card border shadow-sm">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-primary">
                  Confirm Registration
                </h1>
              </div>

              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  {avatar.blobId && (
                    <div className="flex items-center justify-center mb-3">
                      <Avatar className="h-20 w-20">
                        <img
                          src={avatar.url}
                          alt="Avatar"
                          className="object-cover"
                        />
                      </Avatar>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Username
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Wallet Address
                    </span>
                    <span className="text-xs text-primary font-mono">
                      {account.address?.slice(0, 6)}...
                      {account.address?.slice(-4)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCompleteRegistration}
                  disabled={isMinting}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-slide-in">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TaipeiChat</h1>
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
                onClick={() => disconnect()}
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
              <div className="text-xs text-muted-foreground ml-7">
                All Visitors: {visitorsCount}
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-3">
                {/* 當前用戶 */}
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
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
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {username}
                    </div>
                    {/* <div className="text-xs text-muted-foreground font-mono">
                      {account.address?.slice(0, 6)}...
                      {account.address?.slice(-4)}
                    </div> */}
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
                            : msg.sender === "System"
                              ? "System"
                              : `${msg.sender.slice(0, 6)}...${msg.sender.slice(-4)}`}
                        </span>
                        <span className="text-xs opacity-50">
                          {msg.timestamp.toLocaleTimeString("en-US", {
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

export default Index;
