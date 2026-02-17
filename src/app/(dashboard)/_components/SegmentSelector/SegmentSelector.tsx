import { useEffect, useState } from 'react';
import { ComboboxItem, Select } from '@mantine/core';
import { getSegmentsOfCategory } from '@/data/helpers';
import { TCategoryName, TSegmentName } from '@/data/types';

type TSegmentSelectorProps = {
  category?: TCategoryName;
  onChange?: (option: { value: TSegmentName; label: string }) => void;
};

const SegmentSelector = ({ onChange, category }: TSegmentSelectorProps) => {
  const [segment, setSegment] = useState<{ value: TSegmentName; label: string }>({
    value: 'uncategorized',
    label: 'ukategoriseret',
  });

  const handleChange = (option: { value: TSegmentName; label: string }) => {
    setSegment(option);
    onChange?.(option);
  };

  useEffect(() => {
    setSegment({ value: 'uncategorized', label: 'ukategoriseret' });
  }, [category]);

  return (
    <Select
      value={segment.value}
      data={category ? getSegmentsOfCategory(category) : []}
      onChange={(value, option) => {
        handleChange({ value: option.value as TSegmentName, label: option.label });
      }}
      label="Segment"
      disabled={!category || category === 'uncategorized'}
      placeholder="Vælg Segment"
    />
  );
};

export default SegmentSelector;
