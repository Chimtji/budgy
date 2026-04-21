import { useState } from 'react';
import { Select } from '@mantine/core';
import categories from '@/data/categories.json';
import { TCategoryName } from '@/data/types';
import { capitalizeTitle } from '@/utilities';

type TCategorySelectorProps = {
  value?: TCategoryName;
  onChange?: (option: { value: TCategoryName; label: string }) => void;
};

const CategorySelector = ({ value, onChange }: TCategorySelectorProps) => {
  const [category, setCategory] = useState<{ value: TCategoryName; label: string }>({
    value: 'uncategorized',
    label: 'ukategoriseret',
  });

  const currentValue = value ?? category.value;

  const handleChange = (option: { value: TCategoryName; label: string }) => {
    setCategory(option);
    onChange?.(option);
  };

  return (
    <Select
      value={currentValue}
      data={Object.entries(categories).map(([id, data]) => ({
        value: id,
        label: capitalizeTitle(data.label),
      }))}
      onChange={(val, option) => {
        if (!option) return;
        handleChange({ value: option.value as TCategoryName, label: option.label });
      }}
      label="Kategori"
      placeholder="Vælg Kategori"
    />
  );
};

export default CategorySelector;
