'use client';

import { Card, Center, Loader, Table } from '@mantine/core';
import categories from '@/data/categories.json';
import { useBudgetsStore } from '@/stores/budgets/budgetsStore';
import BudgetCell from './BudgetCell';

export default function BudgetGrid() {
  const budgets = useBudgetsStore((state) => state.budgets);
  const loading = useBudgetsStore((state) => state.loading);
  const year = useBudgetsStore((state) => state.year);

  if (loading) {
    return (
      <Card withBorder p="lg">
        <Center h={300}>
          <Loader />
        </Center>
      </Card>
    );
  }

  const monthNames = [
    'Januar',
    'Februar',
    'Marts',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'December',
  ];

  const getCellKey = (categoryId: string, segmentId: string, month: number): string => {
    return `${categoryId}-${segmentId}-${month}`;
  };

  const categoryList = Object.values(categories);

  return (
    <Card withBorder>
      <div style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ minWidth: '200px' }}>Kategori / Segment</Table.Th>
              {monthNames.map((month, idx) => (
                <Table.Th key={idx} align="center" style={{ minWidth: '80px' }}>
                  {month.substring(0, 3)}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {categoryList.map((category) =>
              Object.entries(category.segments).map(([segmentKey, segment], segmentIdx) => (
                <Table.Tr key={`${category.id}-${segmentKey}`}>
                  <Table.Td>
                    <div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{category.label}</div>
                      <div style={{ fontWeight: 500 }}>{segment.label}</div>
                    </div>
                  </Table.Td>
                  {monthNames.map((_, monthIdx) => {
                    const month = monthIdx + 1;
                    const key = getCellKey(category.id, segment.id, month);
                    const value = budgets.get(key);
                    return (
                      <Table.Td key={month} align="center">
                        <BudgetCell
                          categoryId={category.id}
                          segmentId={segment.id}
                          month={month}
                          value={value || 0}
                        />
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
    </Card>
  );
}
