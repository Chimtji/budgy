'use server';

import type { TCategoryName, TSegmentName } from '@/data/types';
import { type TServerResponse } from '@/service';
import { getBankAccounts, isFullAuthenticated } from '@/service/server';

type TBankTransaction = {
  transactionId: string;
  entryReference: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: { amount: string; currency: string };
  additionalInformation: string;
  balanceAfterTransaction: {
    balanceAmount: { amount: string; currency: string };
    balanceType: string;
  };
  internalTransactionId: string;
};

export type TFormattedBankTransaction = {
  company: string;
  amount: number;
  description: string;
  date: Date;
  category: TCategoryName;
  segment: TSegmentName;
  currency: string;
};

type TResult = { [id: string]: TFormattedBankTransaction };

export const getBankTransactions = async (): Promise<TServerResponse<TResult>> => {
  const auth = await isFullAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const accounts = await getBankAccounts();

    if (!accounts.success) {
      return accounts;
    }

    const transactionsOnAccounts = await Promise.all(
      accounts.data.map((account: string) =>
        fetch(`https://bankaccountdata.gocardless.com/api/v2/accounts/${account}/transactions/`, {
          headers: { Authorization: `Bearer ${auth.data.token}` },
        })
          .then((response) => response.json())
          .catch((error) => {
            return { status: 500, error, success: false };
          })
      )
    );

    if (transactionsOnAccounts.length === 0) {
      return { status: 500, error: 'No Transactions found', success: false };
    }

    if (transactionsOnAccounts[0].status_code === 429) {
      return {
        status: 500,
        error: 'API rate limit hit. Cant fetch anymore for the next 24 hours',
        success: false,
      };
    }

    // Sometimes an account can not connect correctly or an error happens on a single account, but the rest is fine.
    // Then we want to keep the valid accounts with transactions and log the error for the invalid accounts and then proceed.
    const accountsWithTransactions = transactionsOnAccounts.filter((group) => {
      if (group.status_code === 503) {
        console.error('Found an account with connection error');
      }

      return Object.hasOwn(group, 'transactions');
    });

    const result: { [id: string]: TFormattedBankTransaction } = {};

    // ATM we don't take pending transactions into account, but only want the booked (done transactions)
    accountsWithTransactions.forEach((group) =>
      group.transactions.booked.forEach((item: TBankTransaction) => {
        const transaction = {
          company: '',
          description: item.additionalInformation,
          amount: parseInt(item.transactionAmount.amount, 10),
          currency: item.transactionAmount.currency,
          date: new Date(item.valueDate),
          category: 'uncategorized' as TCategoryName,
          segment: 'uncategorized' as TSegmentName,
        };

        result[item.internalTransactionId] = transaction;
      })
    );

    return { status: 200, data: result, success: true };
  } catch (error) {
    return { status: 500, error: error, success: false };
  }
};
