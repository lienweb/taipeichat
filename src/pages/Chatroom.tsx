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

const Chatroom = () => {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { disconnect } = useWallet();
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [avatarImage, setAvatarImage] = useState<string>("");
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

export default Chatroom;
