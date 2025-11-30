import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { toast } from '@/hooks/use-toast';

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // 首先嘗試從 localStorage 恢復錢包地址
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setAccount(savedAddress);
    }

    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            localStorage.setItem('walletAddress', accounts[0].address);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        } else {
          setAccount(null);
          localStorage.removeItem('walletAddress');
        }
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    
    // 模擬連接過程
    setTimeout(() => {
      // 生成假的錢包地址
      const fakeAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setAccount(fakeAddress);
      // 保存到 localStorage
      localStorage.setItem('walletAddress', fakeAddress);
      toast({
        title: "Connected Successfully",
        description: `Wallet connected ${fakeAddress.slice(0, 6)}...${fakeAddress.slice(-4)}`,
      });
      setIsConnecting(false);
    }, 800);
  };

  const disconnect = () => {
    setAccount(null);
    // 同時清除 localStorage
    localStorage.removeItem('walletAddress');
    toast({
      title: "Disconnected",
      description: "Wallet has been disconnected",
    });
  };

  return {
    account,
    isConnecting,
    connect,
    disconnect,
  };
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
