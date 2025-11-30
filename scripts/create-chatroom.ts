import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

const PACKAGE_ID = "0x4e2a8c66fe62c78e2ff9005a5616e014bb34e3d7fd3a4b687403177e925d70d7";
const CLOCK_ID = "0x6";

async function createChatroom() {
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  
  console.log("Creating default chatroom...");
  
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::chatroom::create_chatroom`,
    arguments: [
      tx.pure.string("TaipeiChat Default Room"),
      tx.object(CLOCK_ID),
    ],
  });

  console.log("\nTransaction prepared. Please run this transaction using your wallet or CLI:");
  console.log("\nUsing Sui CLI:");
  console.log(`sui client call --package ${PACKAGE_ID} --module chatroom --function create_chatroom --args '"TaipeiChat Default Room"' ${CLOCK_ID} --gas-budget 10000000`);
  
  console.log("\nAfter creating, update CONTRACT_CONFIG.CHATROOM_ID in src/constant.ts with the created ChatRoom object ID.");
}

createChatroom();

