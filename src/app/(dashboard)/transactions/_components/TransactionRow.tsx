'use client';

import { useState } from 'react';
import { IconEdit } from '@tabler/icons-react';
import { Badge, Button, Checkbox, Group, Table } from '@mantine/core';
import categories from '@/data/categories.json';
import { TransactionData } from '@/service/database/transactions';
import TransactionDetail from './TransactionDetail';

interface TransactionRowProps {
  transaction: TransactionData;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

export default function TransactionRow({
  transaction,
  isSelected = false,
  onSelectionChange,
}: TransactionRowProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const getCategoryLabel = () => {
    if (!transaction.categoryId) return 'Ikke kategoriseret';
    for (const cat of Object.values(categories)) {
      if (cat.id === transaction.categoryId) return cat.label;
    }
    return 'Ukendt';
  };

  const getSegmentLabel = () => {
    if (!transaction.segmentId) return '-';
    for (const cat of Object.values(categories)) {
      for (const seg of Object.values(cat.segments)) {
        if (seg.id === transaction.segmentId) return seg.label;
      }
    }
    return 'Ukendt';
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('da-DK');
  const formatAmount = (amount: number) => `${amount.toFixed(2)} kr`;

  const isUncategorized = !transaction.categoryId || !transaction.segmentId;

  const getBgColor = () => {
    if (isUncategorized) return '#fff3bf';
    if (isSelected) return '#d3f9d8';
    return undefined;
  };

  return (
    <>
      <Table.Tr style={{ backgroundColor: getBgColor() }}>
        <Table.Td>
          {onSelectionChange && (
            <Checkbox
              checked={isSelected}
              onChange={(e) => onSelectionChange(e.currentTarget.checked)}
            />
          )}
        </Table.Td>
        <Table.Td>{formatDate(transaction.transactionDate)}</Table.Td>
        <Table.Td>{transaction.merchantName}</Table.Td>
        <Table.Td>{formatAmount(transaction.amount)}</Table.Td>
        <Table.Td>
          <Badge variant="light">{getCategoryLabel()}</Badge>
        </Table.Td>
        <Table.Td>{getSegmentLabel()}</Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconEdit size={14} />}
              onClick={() => setDetailOpen(true)}
            >
              Rediger
            </Button>
          </Group>
        </Table.Td>
      </Table.Tr>

      {detailOpen && (
        <TransactionDetail transaction={transaction} onClose={() => setDetailOpen(false)} />
      )}
    </>
  );
}
