import { TCategoryName } from '@/data/types';
import { TFormattedBankTransaction } from '@/service/server/actions/bank/getBankTransactions';
import { TMatches } from '@/service/server/actions/database/getDbMatches';

export const preCategorize = (
  transaction: TFormattedBankTransaction,
  company: string,
  matches: TMatches
): TCategoryName => {
  return 'uncategorized';
};
