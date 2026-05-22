'use client';

import { Group, Select } from '@mantine/core';

type TCategory = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};

type TProps = {
  categories: TCategory[];
  onFilter: (filters: { year?: number; category_key?: string }) => void;
};

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: '', label: 'Alle år' },
  ...Array.from({ length: 4 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
];

const TransactionFilters: React.FC<TProps> = ({ categories, onFilter }) => {
  const categoryOptions = [
    { value: '', label: 'Alle kategorier' },
    ...categories
      .filter((c) => c.key !== 'internal')
      .map((c) => ({ value: c.key, label: c.label })),
  ];

  const handleYear = (value: string | null) => {
    onFilter({ year: value ? Number(value) : undefined });
  };

  const handleCategory = (value: string | null) => {
    onFilter({ category_key: value ?? undefined });
  };

  return (
    <Group>
      <Select
        placeholder="Alle år"
        data={yearOptions}
        defaultValue=""
        onChange={handleYear}
        w={140}
        allowDeselect={false}
      />
      <Select
        placeholder="Alle kategorier"
        data={categoryOptions}
        defaultValue=""
        onChange={handleCategory}
        w={200}
        allowDeselect={false}
      />
    </Group>
  );
};

export default TransactionFilters;
