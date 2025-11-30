import { WalrusService } from "./type";

// 預設的頭像顏色選項
export const AVATAR_COLORS = [
  "hsl(0, 70%, 60%)",
  "hsl(210, 100%, 60%)",
  "hsl(120, 60%, 50%)",
  "hsl(280, 70%, 60%)",
  "hsl(40, 90%, 55%)",
  "hsl(180, 60%, 50%)",
  "hsl(320, 70%, 60%)",
  "hsl(160, 60%, 50%)",
  "hsl(260, 70%, 65%)",
  "hsl(20, 80%, 60%)",
];

export const PUBLISHER_TESTNET =
  "https://publisher.walrus-testnet.walrus.space";
export const AGGREGATOR_TESTNET =
  "https://aggregator.walrus-testnet.walrus.space";

export const SUISCAN_URL_TESTNET = `https://suiscan.xyz/testnet`;

export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0x4e2a8c66fe62c78e2ff9005a5616e014bb34e3d7fd3a4b687403177e925d70d7",
  PROFILE_REGISTRY_ID: "0xb3ddbc6182a5612196fd558eda0503482da21c14d3787b19a8b3354f64df3fbc",
  PUBLISHER_ID: "0x5255709e7cdac8fc5355de61d22add14bb749adf3af6b47bfa0afd1e4ac668a9",
  DISPLAY_ID: "0x86d8903b2d811a9e6352ec39fb2307193b0daffb99d9ab2a758655b383a56727",
  UPGRADE_CAP_ID: "0x99b86cd90b062031f95e60205e91a3011170ff6edb122b0a8f57cf3d4253cafc",
  CHATROOM_ID: "0xf745b325aef9528f0ddaad059e75a203d068de515690ba14f19b614bb2227012",
  CLOCK_ID: "0x6",
};

export const walrusServices: WalrusService[] = [
  {
    id: "service1",
    name: "walrus.space",
    publisherUrl: "/publisher1",
    aggregatorUrl: "/aggregator1",
  },
  {
    id: "service2",
    name: "staketab.org",
    publisherUrl: "/publisher2",
    aggregatorUrl: "/aggregator2",
  },
  {
    id: "service3",
    name: "redundex.com",
    publisherUrl: "/publisher3",
    aggregatorUrl: "/aggregator3",
  },
  {
    id: "service4",
    name: "nodes.guru",
    publisherUrl: "/publisher4",
    aggregatorUrl: "/aggregator4",
  },
  {
    id: "service5",
    name: "banansen.dev",
    publisherUrl: "/publisher5",
    aggregatorUrl: "/aggregator5",
  },
  {
    id: "service6",
    name: "everstake.one",
    publisherUrl: "/publisher6",
    aggregatorUrl: "/aggregator6",
  },
];
