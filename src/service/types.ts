export const FULL_DAY = 86400 as const;

export type TAPITransactionItem = {
  transactionId: string;
  entryReference: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  additionalInformation: string;
  balanceAfterTransaction: {
    balanceAmount: {
      amount: string;
      currency: string;
    };
    balanceType: string;
  };
  internalTransactionId: string;
};

export type TTimestamp = { _seconds: number; _nanoseconds: number };

export type TAPITransactions = {
  booked: TAPITransactionItem[];
  pending: TAPITransactionItem[];
};

export type TAPIBank = {
  id: string;
  name: string;
  bic?: string;
  transactional_total_days?: string;
  max_access_valid_for_days?: string;
  countries: string[];
  logo: string;
};

export type TServerResponse<T> =
  | { status: 500; error: any; success: false }
  | { status: 200; data: T; success: true }
  | { status: 401; success: false; error: string }
  | { status: 400; success: false; error: string };
