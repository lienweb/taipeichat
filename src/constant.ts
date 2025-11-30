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
  PACKAGE_ID: "0xf7f4c78d6a33601cc2c1c07408e43fe250966b0712fbfe3f1135537e7364a2c8",
  PROFILE_REGISTRY_ID: "0x38fb2534b6918e6d735ae31105f40cc0e2447945c54bfd5dd1dd70a55b46b6af",
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
