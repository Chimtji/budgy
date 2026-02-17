import { useState } from 'react';
import { ComboboxItem, Select } from '@mantine/core';
import categories from '@/data/categories.json';
import { TCategoryName } from '@/data/types';
import { capitalizeTitle } from '@/utilities';

type TCategorySelectorProps = {
  onChange?: (option: { value: TCategoryName; label: string }) => void;
};

const CategorySelector = ({ onChange }: TCategorySelectorProps) => {
  const [category, setCategory] = useState<{ value: TCategoryName; label: string }>({
    value: 'uncategorized',
    label: 'ukategoriseret',
  });

  const handleChange = (option: { value: TCategoryName; label: string }) => {
    setCategory(option);
    onChange?.(option);
  };

  return (
    <Select
      value={category.value}
      data={Object.entries(categories).map(([id, data]) => ({
        value: id,
        label: capitalizeTitle(data.label),
      }))}
      onChange={(value, option) => {
        handleChange({ value: option.value as TCategoryName, label: option.label });
      }}
      label="Kategori"
      placeholder="Vælg Kategori"
    />
  );
};

export default CategorySelector;
