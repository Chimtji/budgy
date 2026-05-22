'use client';

import { useEffect, useState } from 'react';
import { IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { showErrorNotification } from '@/notifications/feedback';
import { matchesPattern } from '@/service/categorization/engine';
import { deleteRule } from '@/service/database/rules/delete';
import { getAllRuleRows, type TRuleRow } from '@/service/database/rules/getAll';
import { upsertRule } from '@/service/database/rules/upsert';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { formatDate } from '@/utilities';
import CompanyLogo from '../companies/_components/CompanyLogo';
import RuleDrawer from './_components/RuleDrawer';
import RuleEditModal from './_components/RuleEditModal';

const RulesPage: React.FC = () => {
  const { categories, segments } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );
  const companies = useCompaniesStore((s) => s.companies);
  const transactions = useTransactionsStore((s) => s.transactions);

  const [rules, setRules] = useState<TRuleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<TRuleRow | null>(null);
  const [editing, setEditing] = useState<TRuleRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    useCompaniesStore.getState().init();
    useTransactionsStore.getState().init({});
    getAllRuleRows().then((result) => {
      if (result.success) setRules(result.data);
      setIsLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    const result = await deleteRule(id);
    if (!result.success) {
      showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette regel' });
      return;
    }
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdate = async (
    id: string,
    pattern: string,
    category_key: string,
    segment_key: string,
    company_id: string | null
  ) => {
    if (!id) {
      // Create new rule
      const result = await upsertRule({ pattern, category_key, segment_key, company_id });
      if (!result.success) {
        showErrorNotification({ title: 'Fejl', message: 'Kunne ikke oprette regel' });
        return;
      }
      const refreshed = await getAllRuleRows();
      if (refreshed.success) setRules(refreshed.data);
      setShowCreate(false);
      return;
    }
    const result = await upsertRule({ pattern, category_key, segment_key, company_id });
    if (!result.success) {
      showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere regel' });
      return;
    }
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, pattern, category_key, segment_key, company_id } : r))
    );
    setEditing(null);
    setViewing(null);
  };

  const filtered = search.trim()
    ? rules.filter((r) => r.pattern.toLowerCase().includes(search.toLowerCase()))
    : rules;

  const getMatchCount = (pattern: string) =>
    transactions.filter((t) => matchesPattern(pattern, `${t.description} ${t.recipient}`)).length;

  const getMatchedTransactions = (pattern: string) =>
    transactions.filter((t) => matchesPattern(pattern, `${t.description} ${t.recipient}`));

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--mantine-spacing-xl) * 2)',
      }}
    >
      <Group justify="space-between" align="flex-end" pb="md" style={{ flexShrink: 0 }}>
        <Stack gap={4}>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
            Autoregler
          </Title>
          <Text size="sm" c="dimmed">
            {rules.length} regler — matchmønstre der bruges til automatisk kategorisering ved import
          </Text>
        </Stack>
        <Group gap="xs">
          <TextInput
            placeholder="Søg i mønstre..."
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={240}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            onClick={() => setShowCreate(true)}
          >
            Ny regel
          </Button>
        </Group>
      </Group>

      {isLoading && <Skeleton radius="md" h={400} />}

      {!isLoading && (
        <Paper
          p="sm"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ScrollArea style={{ flex: 1 }}>
            <Table style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <Table.Thead
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: 'var(--mantine-color-body)',
                }}
              >
                <Table.Tr>
                  <Table.Th>Mønster</Table.Th>
                  <Table.Th w={160}>Virksomhed</Table.Th>
                  <Table.Th w={140}>Kategori</Table.Th>
                  <Table.Th w={140}>Segment</Table.Th>
                  <Table.Th w={110} style={{ whiteSpace: 'nowrap' }}>
                    Antal match
                  </Table.Th>
                  <Table.Th w={130} style={{ whiteSpace: 'nowrap' }}>
                    Sidst opdateret
                  </Table.Th>
                  <Table.Th w={72} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text size="sm" c="dimmed" py="md" ta="center">
                        {search
                          ? 'Ingen regler matcher søgningen.'
                          : 'Ingen regler endnu. De oprettes automatisk når du kategoriserer transaktioner.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {filtered.map((rule) => {
                  const category = categories.find((c) => c.key === rule.category_key);
                  const segment = segments.find(
                    (s) => s.key === rule.segment_key && s.category_key === rule.category_key
                  );
                  const company = rule.company_id
                    ? companies.find((c) => c.id === rule.company_id)
                    : null;
                  return (
                    <Table.Tr
                      key={rule.id}
                      style={{
                        background: 'var(--mantine-color-default-hover)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setViewing(rule)}
                    >
                      <Table.Td style={{ borderRadius: '6px 0 0 6px', maxWidth: 0 }}>
                        <Badge
                          variant="light"
                          color="gray"
                          radius="sm"
                          tt="none"
                          size="md"
                          style={{
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                          }}
                        >
                          {rule.pattern}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {company ? (
                          <Group gap={6} wrap="nowrap" style={{ overflow: 'hidden' }}>
                            <CompanyLogo domain={company.domain} name={company.name} size={20} />
                            <Text
                              size="sm"
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {company.name}
                            </Text>
                          </Group>
                        ) : (
                          <Text size="xs" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {category ? (
                          <Badge variant="light" color={category.color} radius="sm" size="sm">
                            {category.label}
                          </Badge>
                        ) : (
                          <Text size="sm" c="dimmed">
                            {rule.category_key}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {segment ? (
                          <Badge variant="light" color="gray" radius="sm" size="sm">
                            {segment.label}
                          </Badge>
                        ) : rule.segment_key && rule.segment_key !== 'uncategorized' ? (
                          <Text size="sm" c="dimmed">
                            {rule.segment_key}
                          </Text>
                        ) : null}
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue" radius="sm" size="sm">
                          {getMatchCount(rule.pattern)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {formatDate(rule.updated_at)}
                        </Text>
                      </Table.Td>
                      <Table.Td
                        style={{ borderRadius: '0 6px 6px 0' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Group justify="flex-end" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() => setEditing(rule)}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      )}

      <RuleDrawer
        rule={viewing}
        categories={categories}
        segments={segments}
        companies={companies}
        matchedTransactions={viewing ? getMatchedTransactions(viewing.pattern) : []}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
        onClose={() => setViewing(null)}
      />

      {showCreate && (
        <RuleEditModal
          categories={categories}
          segments={segments}
          companies={companies}
          transactions={transactions}
          onSave={handleUpdate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <RuleEditModal
          rule={editing}
          categories={categories}
          segments={segments}
          companies={companies}
          transactions={transactions}
          onSave={handleUpdate}
          onClose={() => setEditing(null)}
        />
      )}
    </Box>
  );
};

export default RulesPage;
