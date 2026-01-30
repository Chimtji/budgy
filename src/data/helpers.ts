import categories from './categories.json';
import months from './months.json';
import { TCategory, TCategoryName, TMonth, TSegment, TSegmentName } from './types';

const getCategory = (category: TCategoryName): TCategory => {
  return categories[category] as TCategory;
};

const getSegment = (category: TCategoryName, segment: TSegmentName): TSegment => {
  const segments = categories[category].segments;
  return segments[segment as keyof typeof segments] as TSegment;
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

export const getMonthLabels = (list: TMonth[]) => {
  return list.map((month) => months[month].label);
};

export const calcDistanceBetweenMonths = (a: TMonth, b: TMonth): number => {
  const aIndex = Object.keys(months).indexOf(a);
  const bIndex = Object.keys(months).indexOf(b);

  return Math.abs(aIndex - bIndex);
};

export const calcAllMonthDistances = (data: TMonth[]) => {
  const monthOrder = Object.keys(months) as TMonth[];

  // Sort months in calendar order
  const sortedData = [...data].sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

  const distances = [];

  for (let i = 1; i < sortedData.length; i++) {
    const prev = sortedData[i - 1];
    const curr = sortedData[i];
    const distance = calcDistanceBetweenMonths(prev, curr);
    distances.push(distance);
  }

  return distances;
};

export const resolveCadenceLabel = (data: TMonth[]): string[] => {
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
