import { MultiSelect } from '@mantine/core';
import months from '@/data/months.json';
import { TMonthIndex } from '@/data/types';

type TCadenceSelectorProps = {
  value: TMonthIndex[];
  onChange?: (value: TMonthIndex[]) => void;
};

const monthKeys = Object.keys(months);

const ALL_MONTHS = monthKeys.map((key) => parseInt(key, 10) as TMonthIndex);
const QUARTERLY_MONTHS: TMonthIndex[] = [3, 6, 9, 12];
const HALF_YEAR_MONTHS: TMonthIndex[] = [1, 7];

const monthKeySet = new Set(monthKeys);

const CadenceSelector = ({ value, onChange }: TCadenceSelectorProps) => {
  const stringValue = value.map((v) => v.toString());

  const data = [
    {
      group: 'Genveje',
      items: [
        { value: 'preset_all', label: 'Alle måneder' },
        { value: 'preset_quarterly', label: 'Kvartalsvis' },
        { value: 'preset_halfyear', label: 'Halvårligt' },
      ],
    },
    {
      group: 'Måneder',
      items: monthKeys.map((key) => ({
        value: key,
        label: months[key as keyof typeof months].label,
      })),
    },
  ];

  const handleChange = (next: string[]) => {
    let result: TMonthIndex[] = [];

    if (next.includes('preset_all')) {
      result = ALL_MONTHS;
    } else if (next.includes('preset_quarterly')) {
      result = QUARTERLY_MONTHS;
    } else if (next.includes('preset_halfyear')) {
      result = HALF_YEAR_MONTHS;
    } else {
      const monthValues = next.filter((v) => monthKeySet.has(v));
      result = monthValues.map((v) => parseInt(v, 10) as TMonthIndex);
    }

    onChange?.(result);
  };

  return (
    <MultiSelect
      label="Betales"
      placeholder="Vælg måneder"
      value={stringValue}
      data={data}
      onChange={handleChange}
      clearable
      searchable={false}
      maxDropdownHeight={260}
    />
  );
};

export default CadenceSelector;

