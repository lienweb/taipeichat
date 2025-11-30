export type WalrusService = {
  id: string;
  name: string;
  publisherUrl: string;
  aggregatorUrl: string;
};

export interface ProfileData {
  username: string;
  bio: string;
  imageBlobId: string;
  owner: string;
  createdAt: string;
}
