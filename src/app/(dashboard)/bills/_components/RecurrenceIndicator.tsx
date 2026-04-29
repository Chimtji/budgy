'use client';

import { Badge } from '@mantine/core';

const CADENCE_LABELS: Record<string, string> = {
  MONTHLY: 'Månedlig',
  QUARTERLY: 'Kvartalsvist',
  BIANNUAL: 'Halvårlig',
  ANNUAL: 'Årlig',
  IRREGULAR: 'Uregelmæssig',
};

const CADENCE_COLORS: Record<string, string> = {
  MONTHLY: 'blue',
  QUARTERLY: 'violet',
  BIANNUAL: 'indigo',
  ANNUAL: 'grape',
  IRREGULAR: 'gray',
};

interface RecurrenceIndicatorProps {
  cadence: string;
}

export default function RecurrenceIndicator({ cadence }: RecurrenceIndicatorProps) {
  return (
    <Badge color={CADENCE_COLORS[cadence] || 'gray'} variant="light">
      {CADENCE_LABELS[cadence] || cadence}
    </Badge>
  );
}
