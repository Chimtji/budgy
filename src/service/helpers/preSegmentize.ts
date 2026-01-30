import { TCategoryName, TSegmentName } from '@/data/types';
import { TFormattedBankTransaction } from '@/service/server/actions/bank/getBankTransactions';
import { TMatches } from '@/service/server/actions/database/getDbMatches';

export const preSegmentize = (
  transaction: TFormattedBankTransaction,
  company: string,
  category: TCategoryName,
  matches: TMatches
): TSegmentName => {
  return 'uncategorized';
};
