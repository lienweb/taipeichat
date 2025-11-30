import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Wallet, Link2Off, Upload, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { account, disconnect } = useWallet();
  const [username] = useState(localStorage.getItem('username') || '');
  const [avatarImage, setAvatarImage] = useState<string | null>(
    localStorage.getItem('avatarImage') || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [hasUploadedNewImage, setHasUploadedNewImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      // Simulate 3 second upload delay
      setTimeout(() => {
        const base64String = reader.result as string;
        setAvatarImage(base64String);
        localStorage.setItem('avatarImage', base64String);
        setIsUploading(false);
        setHasUploadedNewImage(true);
        
        toast({
          title: "Upload Successful",
          description: "Your avatar has been uploaded",
        });
      }, 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleUnbindWallet = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('avatarImage');
    localStorage.removeItem('walletAddress');
    
    disconnect();
    
    toast({
      title: "Unbind Successful",
      description: "Your wallet has been unbound",
    });
    
    setTimeout(() => {
      navigate('/');
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chatroom
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
            <p className="text-muted-foreground">Edit your personal information</p>
          </div>

          <Card className="p-8 bg-card border">
            <div className="space-y-8">
              {/* Current Avatar Preview */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  {avatarImage ? (
                    <AvatarImage src={avatarImage} alt={username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground">{username}</h2>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </p>
                </div>
              </div>

              {/* 個人資訊 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Username</span>
                      <span className="text-sm font-medium text-foreground">{username}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 錢包綁定資訊 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Wallet Binding</h3>
                <div className="bg-muted rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground mb-1">Connected Wallet</div>
                        <div className="text-xs font-mono text-muted-foreground break-all">
                          {account}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Link2Off className="mr-2 h-4 w-4" />
                        Unbind Wallet
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-popover">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Unbind?</AlertDialogTitle>
                        <AlertDialogDescription>
                          After unbinding, you will need to reconnect your wallet and set up your profile again. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleUnbindWallet}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Upload Avatar</h3>
                <p className="text-sm text-muted-foreground">Upload a profile picture (max 2MB)</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                  variant="outline"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </>
                  )}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => navigate('/')}
                  disabled={isUploading || !hasUploadedNewImage}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
