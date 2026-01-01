# TaipeiChat

A chat application built on Sui blockchain and Walrus decentralized storage,
using Profile NFT as user identity credentials.

All smart contracts are currently deployed to Sui Testnet.

## Tech Stack

### Frontend

- [React](https://react.dev/) - UI Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Checking
- [Vite](https://vitejs.dev/) - Build Tool
- [Radix UI](https://www.radix-ui.com/) - UI Component Library
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [React Router](https://reactrouter.com/) - Routing
- [React Query](https://tanstack.com/query) - State Management
- [@mysten/dapp-kit](https://sdk.mystenlabs.com/dapp-kit)
- [@mysten/sui](https://www.npmjs.com/package/@mysten/sui)
- [pnpm](https://pnpm.io/) - Package Manager

### Blockchain

- [Sui Move](https://docs.sui.io/concepts/sui-move-concepts) - Smart Contract

### Storage

- [Walrus](https://docs.wal.app/) - Decentralized Storage

## Features

### 1. Decentralized Identity System

- Use Sui Profile NFT as user identity credentials
- Each user owns a unique Profile NFT containing username, bio, and avatar image
  blob id
- On-chain identity verification without backend servers

### 2. On-chain Chatroom

- On-chain chatroom based on Sui testnet
- Messages permanently stored on-chain
- Real-time display of user list

### 3. Walrus Decentralized Storage

- Store user avatar images using Walrus when registered
- Support up to 2MB image uploads
- Avatar can be updated at profile page
- Decentralized storage with permanent data preservation

### 4. Real-time Messaging System

- Real-time message display
- Show user list with avatar image
- Responsive design supporting mobile devices

## Quick Start

```bash
pnpm install
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Deployment Process

1. Compile contracts:

```bash
cd contract
sui move build
```

2. Publish contracts:

```bash
sui client publish --gas-budget 100000000
```

3. Deploy frontend to Vercel

## Technical Highlights

1. **Decentralized Identity** - Use NFT as user identity
2. **Efficient Storage** - Dynamic Fields optimize on-chain message storage
3. **Decentralized Files** - Walrus stores user avatars with permanent
   preservation
4. **Responsive Design** - Support for desktop and mobile devices
5. **State Management** - React Query provides elegant data synchronization

<!-- ## License

MIT -->

## Contributing

Issues and Pull Requests are welcome!

## Contact

For questions, please open a GitHub Issue.
