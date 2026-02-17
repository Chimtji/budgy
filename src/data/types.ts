import categories from './categories.json';
import months from './months.json';

export type TCategoryName = keyof typeof categories;
export type TSegmentName = {
  [K in keyof typeof categories]: keyof (typeof categories)[K]['segments'];
}[keyof typeof categories];

export type TSegment = {
  id: string;
  label: string;
  description: string;
};

export type TCategory = {
  color: string;
  id: string;
  label: TCategoryName;
  image: string;
  icon: string;
  description: string;
  segments: {
    [key in TSegmentName]: TSegment;
  };
};

export type TMonth = keyof typeof months;
export type TMonthIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
