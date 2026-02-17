import { capitalizeTitle } from '@/utilities';
import categories from './categories.json';
import months from './months.json';
import { TCategory, TCategoryName, TMonth, TMonthIndex, TSegment, TSegmentName } from './types';

const getCategory = (category: TCategoryName): TCategory => {
  return categories[category] as TCategory;
};

const getSegment = (category: TCategoryName, segment: TSegmentName): TSegment => {
  const segments = categories[category].segments;
  return segments[segment as keyof typeof segments] as TSegment;
};

export const getSegmentsOfCategory = (
  category: TCategoryName
): { value: string; label: string }[] => {
  const segments = categories[category].segments;

  const result = Object.entries(segments).map(([id, data]) => ({
    value: id,
    label: capitalizeTitle(data.label),
  }));

  return result;
};

export const getLabelOfCategory = (category: TCategoryName) => {
  const result = getCategory(category).label;
  return result;
};
export const getLabelOfSegment = (category: TCategoryName, segment: TSegmentName) => {
  const result = getSegment(category, segment).label;
  return result;
};

export const getColorOfCategory = (category: TCategoryName) => {
  const result = getCategory(category).color;
  return result;
};

export const getMonthLabels = (list: TMonthIndex[]) => {
  return list.map((month) => months[month].label);
};

export const getMonthLabel = (month: TMonthIndex) => {
  return months[month].label;
};

export const calcDistanceBetweenMonths = (a: TMonthIndex, b: TMonthIndex): number => {
  return Math.abs(a - b);
};

export const calcAllMonthDistances = (data: TMonthIndex[]) => {
  // Sort months in calendar order
  const sortedData = [...data].sort((a, b) => a - b);

  const distances = [];

  for (let i = 1; i < sortedData.length; i++) {
    const prev = sortedData[i - 1];
    const curr = sortedData[i];
    const distance = calcDistanceBetweenMonths(prev, curr);
    distances.push(distance);
  }

  return distances;
};

export const resolveCadenceLabel = (data: TMonthIndex[]): string[] => {
  const distances = calcAllMonthDistances(data);
  const count = data.length;

  // Edge cases based on count
  if (count === 1) {
    return ['Årligt'];
  } else if (count === 2 && distances[0] === 6) {
    return ['Halvårligt'];
  }

  // Pattern checks for common cadences
  if (count === 4 && distances.every((d) => d === 3)) {
    return ['Hvert Kvartal'];
  } else if (count === 6 && distances.every((d) => d === 2)) {
    return ['Hver 2. Måned'];
  } else if (count === 3 && distances.every((d) => d === 4)) {
    return ['Hver 4. Måned'];
  } else if (count === 2 && distances.every((d) => d === 5)) {
    return ['Hver 5. Måned'];
  } else if (count === 12 && distances.every((d) => d === 1)) {
    return ['Hver Måned'];
  } else {
    return getMonthLabels(data);
  }
};

export const resolveStatus = (category: string, segment: string) => {
  if (category === 'uncategorized' || segment === 'uncategorized') {
    return 'pending';
  } else {
    return 'added';
  }
};

export const toMonthIndexStrings = (monthIndexes: TMonthIndex[]): string[] => {
  return monthIndexes.map((index) => index.toString());
};

export const toMonthIndexNumbers = (monthIndexes: string[]): TMonthIndex[] => {
  return monthIndexes.map((index) => parseInt(index, 10) as TMonthIndex);
};
