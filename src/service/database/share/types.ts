export type TShareMetadata = {
  passwordHash?: string;
  expiresAt?: string;
};

export type TShareListEntry = {
  shareId: string;
  createdAt: string;
  expiresAt: string | null;
  passwordProtected: boolean;
  status: 'active' | 'revoked';
};

export type TShareList = TShareListEntry[];
