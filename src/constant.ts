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

export const SUISCAN_URL_TESTNET = `https://suiscan.xyz/testnet`;

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
