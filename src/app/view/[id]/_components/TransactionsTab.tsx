import { useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Badge, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import type { TCategory } from '@/service/database/categories/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TProps = {
  transactions: TTransaction[];
  categories: TCategory[];
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(amount);

export const TransactionsTab = ({ transactions, categories }: TProps) => {
  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => new Date(t.date).getFullYear()));
    return [
      { label: 'Alle år', value: '' },
      ...Array.from(set)
        .sort((a, b) => b - a)
        .map((y) => ({ label: String(y), value: String(y) })),
    ];
  }, [transactions]);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return transactions.filter((t) => {
      if (year && new Date(t.date).getFullYear() !== Number(year)) return false;
      if (
        q &&
        !t.description.toLowerCase().includes(q) &&
        !(t.recipient ?? '').toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [transactions, year, query]);

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="Søg..."
          leftSection={<IconSearch size={14} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select data={years} value={year} onChange={(v) => setYear(v ?? '')} w={120} />
      </Group>

      <Table
        striped={false}
        highlightOnHover
        style={{ borderSpacing: '0 4px', borderCollapse: 'separate' }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dato</Table.Th>
            <Table.Th>Beskrivelse</Table.Th>
            <Table.Th>Kategori</Table.Th>
            <Table.Th ta="right">Beløb</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.slice(0, 200).map((t) => {
            const cat = categories.find((c) => c.key === t.category_key);
            return (
              <Table.Tr key={t.id}>
                <Table.Td
                  style={{
                    background: 'var(--mantine-color-default-hover)',
                    borderRadius: '6px 0 0 6px',
                  }}
                >
                  <Text size="sm" c="dimmed">
                    {t.date}
                  </Text>
                </Table.Td>
                <Table.Td style={{ background: 'var(--mantine-color-default-hover)' }}>
                  <Text size="sm">{t.description}</Text>
                </Table.Td>
                <Table.Td style={{ background: 'var(--mantine-color-default-hover)' }}>
                  {cat && (
                    <Badge color={cat.color} variant="light" radius="sm" size="sm">
                      {cat.label}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td
                  ta="right"
                  style={{
                    background: 'var(--mantine-color-default-hover)',
                    borderRadius: '0 6px 6px 0',
                  }}
                >
                  <Text size="sm" fw={500} c={t.amount < 0 ? 'red' : 'green'}>
                    {formatAmount(t.amount)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
      {filtered.length > 200 && (
        <Text size="xs" c="dimmed" ta="center">
          Viser 200 af {filtered.length} transaktioner
        </Text>
      )}
    </Stack>
  );
};
