import { useEffect, useState } from 'react';
import { Select } from '@mantine/core';
import { getSegmentsOfCategory } from '@/data/helpers';
import { TCategoryName, TSegmentName } from '@/data/types';

type TSegmentSelectorProps = {
  category?: TCategoryName;
  value?: TSegmentName;
  onChange?: (option: { value: TSegmentName; label: string }) => void;
};

const SegmentSelector = ({ onChange, category, value }: TSegmentSelectorProps) => {
  const [segment, setSegment] = useState<{ value: TSegmentName; label: string }>({
    value: 'uncategorized',
    label: 'ukategoriseret',
  });

  const handleChange = (option: { value: TSegmentName; label: string }) => {
    setSegment(option);
    onChange?.(option);
  };

  useEffect(() => {
    if (!value) {
      setSegment({ value: 'uncategorized', label: 'ukategoriseret' });
    }
  }, [category, value]);

  const currentValue = value ?? segment.value;

  return (
    <Select
      value={currentValue}
      data={category ? getSegmentsOfCategory(category) : []}
      onChange={(val, option) => {
        if (!option) return;
        handleChange({ value: option.value as TSegmentName, label: option.label });
      }}
      label="Segment"
      disabled={!category || category === 'uncategorized'}
      placeholder="Vælg Segment"
    />
  );
};

export default SegmentSelector;
