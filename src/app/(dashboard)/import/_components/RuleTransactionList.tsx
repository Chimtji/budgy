'use client';

import { useMemo, useState } from 'react';
import { Divider, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { matchesPattern } from '@/service/categorization/engine';
import { formatDate } from '@/utilities';

type TParsedRow = {
  date: string;
  amount: number;
  description: string;
  recipient: string;
  balance?: number | null;
  supp_text?: string | null;
};

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

const RuleTransactionList: React.FC<{
  pattern: string;
  rows: TParsedRow[];
  defaultRows?: TParsedRow[];
}> = ({ pattern, rows, defaultRows }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const matching = useMemo(() => {
    setSelectedIndex(null);
    if (!pattern.trim()) return (defaultRows ?? rows).slice(0, 50);
    return rows.filter((r) => matchesPattern(pattern, `${r.description} ${r.recipient}`));
  }, [rows, pattern]);

  return (
    <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
      <Text size="sm" fw={500}>
        {pattern.trim()
          ? `${matching.length} matchende rækker`
          : defaultRows
            ? `${matching.length} rækker i gruppen`
            : 'Seneste rækker'}
      </Text>
      <ScrollArea h={360}>
        <Stack gap={4}>
          {matching.length === 0 && (
            <Text size="sm" c="dimmed">
              Ingen rækker matcher de angivne mønstre.
            </Text>
          )}
          {matching.map((r, i) => {
            const isSelected = selectedIndex === i;
            return (
              <Stack
                key={i}
                gap={2}
                p="xs"
                onClick={() => setSelectedIndex(isSelected ? null : i)}
                style={{
                  borderRadius: 6,
                  background: isSelected
                    ? 'var(--mantine-color-blue-light)'
                    : 'var(--mantine-color-default-hover)',
                  cursor: 'pointer',
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(r.date)}
                  </Text>
                  <Text
                    size="xs"
                    fw={600}
                    c={r.amount < 0 ? 'red.6' : 'teal.6'}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {formatDKK(r.amount)}
                  </Text>
                </Group>
                {r.recipient && (
                  <Text size="xs" fw={500}>
                    {r.recipient}
                  </Text>
                )}
                <Text size="xs" c="dimmed" style={{ wordBreak: 'break-word' }}>
                  {r.description}
                </Text>
                {isSelected && (
                  <>
                    <Divider my={4} />
                    {r.balance != null && (
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          Saldo efter
                        </Text>
                        <Text size="xs">{formatDKK(r.balance)}</Text>
                      </Group>
                    )}
                    {r.supp_text && (
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">
                          Supplerende tekst
                        </Text>
                        <Text size="xs" style={{ wordBreak: 'break-word' }}>
                          {r.supp_text}
                        </Text>
                      </Stack>
                    )}
                  </>
                )}
              </Stack>
            );
          })}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};

export default RuleTransactionList;
