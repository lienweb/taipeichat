import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

export const PageLoader = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* 背景粒子效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: "hsl(200, 100%, 40%)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: 0.2 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* 標準 Loading Spinner */}
        <div className="relative w-20 h-20">
          {/* 旋轉的圓環 */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: "hsl(200, 100%, 40%)",
              borderRightColor: "hsl(200, 100%, 40%)",
              animationDuration: "1s",
            }}
          />

          {/* 中心 Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "hsl(200, 100%, 40%)",
                boxShadow: "0 0 20px hsl(200, 100%, 40% / 0.4)",
              }}
            >
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* 載入文字與進度指示 */}
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-lg font-bold tracking-wider"
            style={{ color: "hsl(200, 100%, 40%)" }}
          >
            TaipeiChat
          </p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: "hsl(200, 100%, 40%)",
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.6s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
