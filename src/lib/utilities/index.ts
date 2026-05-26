import { TTimestamp } from '@/service';

export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const capitalizeTitle = (str: string): string =>
  str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const isNegative = (amount: number) => {
  return amount < 0;
};

export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;

  if (typeof a !== typeof b || a === null || b === null) return false;

  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!b.hasOwnProperty(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
};

/** Formats a YYYY-MM-DD (or ISO) date string as DD-MM-YYYY */
export const formatDate = (date: string): string => {
  const [y, m, d] = date.slice(0, 10).split('-');
  return `${d}-${m}-${y}`;
};

export const makeSafeObject = (unsafeObject: any): any => {
  return JSON.parse(JSON.stringify(unsafeObject));
};

export const convertFirebaseTimestamp = (timestamp: TTimestamp) => {
  return new Date(timestamp._seconds * 1000);
};
