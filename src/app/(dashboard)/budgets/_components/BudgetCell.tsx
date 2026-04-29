'use client';

import { NumberInput } from '@mantine/core';
import { useBudgetsStore } from '@/stores/budgets/budgetsStore';

interface BudgetCellProps {
  categoryId: string;
  segmentId: string;
  month: number;
  value: number;
}

export default function BudgetCell({ categoryId, segmentId, month, value }: BudgetCellProps) {
  const updateCell = useBudgetsStore((state) => state.updateCell);

  const handleChange = (newValue: number | string) => {
    const numValue = typeof newValue === 'string' ? parseFloat(newValue) || 0 : newValue;
    updateCell(categoryId, segmentId, month, numValue);
  };

  return (
    <NumberInput
      value={value}
      onChange={handleChange}
      placeholder="0"
      min={0}
      step={100}
      decimalScale={2}
      fixedDecimalScale
      hideControls
      size="xs"
      style={{ width: '70px' }}
    />
  );
}
