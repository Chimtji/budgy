import { TTimestamp } from '@/service';

// Generic sort function
export const sortItems = <T>(
  column: keyof T,
  allItems: Record<string, T>,
  sortDirection: 'asc' | 'desc'
): Record<string, T> => {
  const sorted = Object.entries(allItems).sort(([idA, a], [idB, b]) => {
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
      return sortDirection === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }

    if (dataType === 'timestamp') {
      const testA = valA as TTimestamp;
      const testB = valB as TTimestamp;

      const dateA = new Date(testA._seconds * 1000);
      const dateB = new Date(testB._seconds * 1000);

      return sortDirection === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    if (dataType === 'date') {
      const testA = valA as Date;
      const testB = valB as Date;

      return sortDirection === 'asc'
        ? testA.getTime() - testB.getTime()
        : testB.getTime() - testA.getTime();
    }

    // Assume string fallback
    const testA = (valA as string)?.toLowerCase?.() ?? '';
    const testB = (valB as string)?.toLowerCase?.() ?? '';
    return sortDirection === 'asc' ? testA.localeCompare(testB) : testB.localeCompare(testA);
  });

  return sorted.reduce<Record<string, T>>((acc, [id, item]) => {
    acc[id] = item;
    return acc;
  }, {});
};
