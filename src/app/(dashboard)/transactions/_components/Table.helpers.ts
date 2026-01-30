import { identity } from '@mantine/core/lib/core/factory/factory';
import { TTimestamp } from '@/service';
import type { TTransaction, TTransactions } from '@/stores/transactions/transactionsStore';

export const sortTransactions = (
  column: keyof TTransaction,
  allTransactions: TTransactions,
  sortDirection: 'asc' | 'desc'
) => {
  const sorted = Object.entries(allTransactions).sort(([idA, a], [idB, b]) => {
    const valA = a[column];
    const valB = b[column];

    const dataType =
      typeof valA === 'number' && typeof valB === 'number'
        ? 'number'
        : valA instanceof Date && valB instanceof Date
          ? 'date'
          : typeof valA === 'object' && typeof valB === 'object'
            ? 'timestamp'
            : 'string';

    if (dataType === 'number') {
      const testA = valA as number;
      const testB = valB as number;
      return sortDirection === 'asc' ? testA - testB : testB - testA;
    }

    if (dataType === 'timestamp') {
      const testA = valA as TTimestamp;
      const testB = valB as TTimestamp;

      const testADate = new Date(testA._seconds);
      const testBDate = new Date(testB._seconds);

      return sortDirection === 'asc'
        ? testADate.getTime() - testBDate.getTime()
        : testBDate.getTime() - testADate.getTime();
    }

    if (dataType === 'date') {
      const testA = valA as unknown as Date;
      const testB = valB as unknown as Date;
      return sortDirection === 'asc'
        ? testA.getTime() - testB.getTime()
        : testB.getTime() - testA.getTime();
    }

    //dataType = string
    const testA = (valA as string).toLowerCase();
    const testB = (valB as string).toLowerCase();
    return sortDirection === 'asc' ? testA.localeCompare(testB) : testB.localeCompare(testA);
  });

  return sorted.reduce<TTransactions>((acc, [id, transaction]) => {
    acc[id] = transaction;
    return acc;
  }, {});
};

export const resolveStatus = (transaction: TTransaction) => {
  if (transaction.category === 'uncategorized' || transaction.segment === 'uncategorized') {
    return 'pending';
  } else {
    return 'added';
  }
};
