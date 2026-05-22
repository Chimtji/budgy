'use client';

import { IconPencil } from '@tabler/icons-react';
import { ActionIcon, Badge, Divider, Drawer, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { parsePatternGroups } from '@/service/categorization/engine';
import type { TRuleRow } from '@/service/database/rules/getAll';
import { formatDate } from '@/utilities';
import CompanyLogo from '../../companies/_components/CompanyLogo';

type TCategory = { key: string; label: string; color: string };
type TSegment = { key: string; category_key: string; label: string };
type TCompany = { id: string; name: string; domain: string | null };
type TTransaction = {
  id: string;
  date: string;
  amount: number;
  description: string;
  recipient: string;
  company_name: string | null;
  company_domain: string | null;
};

type TProps = {
  rule: TRuleRow | null;
  categories: TCategory[];
  segments: TSegment[];
  companies: TCompany[];
  matchedTransactions: TTransaction[];
  onEdit: () => void;
  onClose: () => void;
};

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

const RuleDrawer: React.FC<TProps> = ({
  rule,
  categories,
  segments,
  companies,
  matchedTransactions,
  onEdit,
  onClose,
}) => {
  if (!rule) return null;

  const groups = parsePatternGroups(rule.pattern);
  const category = categories.find((c) => c.key === rule.category_key);
  const segment = segments.find(
    (s) => s.key === rule.segment_key && s.category_key === rule.category_key
  );

  return (
    <Drawer opened={!!rule} onClose={onClose} title="Regeldetaljer" position="right" size="md">
      <Stack gap="lg" style={{ height: '100%' }}>
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={6} style={{ flex: 1 }}>
              <Text
                size="xs"
                fw={500}
                c="dimmed"
                tt="uppercase"
                style={{ letterSpacing: '0.05em' }}
              >
                Betingelser
              </Text>
              <Stack gap={6}>
                {groups.map((group, gi) => (
                  <Stack key={gi} gap={4}>
                    {gi > 0 && (
                      <Text size="xs" c="dimmed" fw={500}>
                        ELLER
                      </Text>
                    )}
                    <Group gap={4} wrap="wrap">
                      {group.map((term, ti) => (
                        <Group key={ti} gap={4} wrap="nowrap">
                          {ti > 0 && (
                            <Text size="xs" c="dimmed">
                              OG
                            </Text>
                          )}
                          <Badge variant="light" color="gray" radius="sm" size="sm" tt="none">
                            {term}
                          </Badge>
                        </Group>
                      ))}
                    </Group>
                  </Stack>
                ))}
              </Stack>
            </Stack>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={onEdit}>
              <IconPencil size={14} stroke={1.5} />
            </ActionIcon>
          </Group>

          <Group gap="xs">
            {category && (
              <Badge variant="light" color={category.color} radius="sm" size="sm">
                {category.label}
              </Badge>
            )}
            {segment && (
              <Badge variant="light" color="gray" radius="sm" size="sm">
                {segment.label}
              </Badge>
            )}
          </Group>
        </Stack>

        <Divider />

        <Text size="sm" c="dimmed">
          {matchedTransactions.length} matchende transaktioner
        </Text>

        <ScrollArea style={{ flex: 1 }}>
          <Stack gap={4}>
            {matchedTransactions.map((t) => {
              const company = companies.find((c) => c.name === t.company_name);
              const domain = t.company_domain ?? company?.domain ?? null;
              return (
                <Group
                  key={t.id}
                  justify="space-between"
                  wrap="nowrap"
                  px="sm"
                  py="xs"
                  style={{ borderRadius: 6, background: 'var(--mantine-color-default-hover)' }}
                >
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <CompanyLogo domain={domain} name={t.company_name ?? t.description} size={24} />
                    <Stack gap={0} style={{ minWidth: 0 }}>
                      <Text
                        size="sm"
                        fw={500}
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.company_name ?? t.description}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDate(t.date)}
                      </Text>
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
      </Stack>
    </Drawer>
  );
};

export default RuleDrawer;
