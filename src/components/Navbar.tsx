import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarColor } from "@/helpers/avatar";
import { Menu, Wallet, UserCog, LogOut } from "lucide-react";

interface NavbarProps {
  username: string;
  avatarImage?: string;
  showMenu?: boolean;
  title?: string;
  onMenuClick?: () => void;
  onNavigateProfile: () => void;
  onLogout: () => void;
}

export default function Navbar({
  username,
  avatarImage,
  showMenu = false,
  title = "Web3 Chatroom",
  onMenuClick,
  onNavigateProfile,
  onLogout,
}: NavbarProps) {
  return (
    <header className="flex-shrink-0 border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showMenu && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-primary lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
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
                style={{ backgroundColor: getAvatarColor(username) }}
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
              onClick={onNavigateProfile}
              className="cursor-pointer"
            >
              <UserCog className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
