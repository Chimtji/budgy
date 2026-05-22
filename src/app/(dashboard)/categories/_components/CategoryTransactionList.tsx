'use client';

import { Badge, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import { formatDate } from '@/utilities';
import CompanyLogo from '../../companies/_components/CompanyLogo';

type TTransaction = {
  id: string;
  date: string;
  amount: number;
  description: string;
  recipient: string;
  segment_key: string | null;
  company_name: string | null;
  company_domain: string | null;
};
type TSegment = { key: string; category_key: string; label: string };
type TCategory = { key: string; label: string; color: string };

type TProps = {
  transactions: TTransaction[];
  category: TCategory;
  segments: TSegment[];
  onSelect: (t: TTransaction) => void;
};

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

const CategoryTransactionList: React.FC<TProps> = ({
  transactions,
  category,
  segments,
  onSelect,
}) => {
  const companies = useCompaniesStore((s) => s.companies);

  if (transactions.length === 0) {
    return (
      <Stack align="center" justify="center" style={{ flex: 1, minHeight: 200 }}>
        <Text size="sm" c="dimmed">
          Ingen transaktioner i denne kategori
        </Text>
      </Stack>
    );
  }

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0 }}>
      <Stack gap={4}>
        {transactions.map((t) => {
          const segment = segments.find(
            (s) => s.key === t.segment_key && s.category_key === category.key
          );
          const company = companies.find((c) => c.name === t.company_name);
          return (
            <Group
              key={t.id}
              justify="space-between"
              wrap="nowrap"
              px="sm"
              py="xs"
              onClick={() => onSelect(t)}
              style={{
                borderRadius: 6,
                background: 'var(--mantine-color-default-hover)',
                cursor: 'pointer',
              }}
            >
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                {t.company_name && (
                  <CompanyLogo
                    domain={company?.domain ?? t.company_domain}
                    name={t.company_name}
                    size={24}
                  />
                )}
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text
                    size="sm"
                    fw={500}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {t.company_name ?? t.description}
                  </Text>
                  <Group gap={6} align="center">
                    <Text size="xs" c="dimmed">
                      {formatDate(t.date)}
                    </Text>
                    {segment && (
                      <Badge variant="light" color="gray" radius="sm" size="sm">
                        {segment.label}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Group>
              <Text
                size="sm"
                fw={600}
                c={t.amount < 0 ? 'red.6' : 'teal.6'}
                style={{ whiteSpace: 'nowrap' }}
              >
                {formatDKK(t.amount)}
              </Text>
            </Group>
          );
        })}
      </Stack>
    </ScrollArea>
  );
};

export default CategoryTransactionList;
