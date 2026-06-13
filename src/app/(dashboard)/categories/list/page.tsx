'use client';

import { useEffect, useState } from 'react';
import * as TablerIcons from '@tabler/icons-react';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import type { TTransaction } from '@/service/database/transactions/getAll';
import { useAppStore } from '@/stores/app/appStore';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { formatDate } from '@/utilities';
import CategoryForm from '../_components/CategoryForm';
import SegmentForm from '../_components/SegmentForm';
import CompanyLogo from '../../companies/_components/CompanyLogo';
import TransactionDrawer from '../../transactions/_components/TransactionDrawer';

type TCategory = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};
type TSegment = {
  id: string;
  key: string;
  category_key: string;
  label: string;
  description: string;
};

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

export default function CategoriesListPage() {
  const isReadOnly = useAppStore((s) => s.isReadOnly);
  const {
    categories,
    segments,
    addCategory,
    updateCategory,
    removeCategory,
    addSegment,
    updateSegment,
    removeSegment,
  } = useCategoriesStore(
    useShallow((s) => ({
      categories: s.categories,
      segments: s.segments,
      addCategory: s.addCategory,
      updateCategory: s.updateCategory,
      removeCategory: s.removeCategory,
      addSegment: s.addSegment,
      updateSegment: s.updateSegment,
      removeSegment: s.removeSegment,
    }))
  );
  const { transactions, isLoading, init } = useTransactionsStore(
    useShallow((s) => ({ transactions: s.transactions, isLoading: s.isLoading, init: s.init }))
  );
  const companies = useCompaniesStore((s) => s.companies);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null); // null = 'all'
  const [selectedTransaction, setSelectedTransaction] = useState<TTransaction | null>(null);

  const [editingCategory, setEditingCategory] = useState<TCategory | undefined>(undefined);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState<TSegment | undefined>(undefined);
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [segmentCategoryKey, setSegmentCategoryKey] = useState('');

  useEffect(() => {
    useCategoriesStore.getState().initCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setSelectedSegment(null);
      init({ category_key: selectedCategory });
    }
  }, [selectedCategory]);

  const handleSelectCategory = (key: string) => {
    setSelectedCategory((prev) => (prev === key ? null : key));
  };

  const handleAddSegment = (categoryKey: string) => {
    setSegmentCategoryKey(categoryKey);
    setEditingSegment(undefined);
    setShowSegmentForm(true);
  };

  const visibleTransactions = selectedSegment
    ? transactions.filter((t) => t.segment_key === selectedSegment)
    : transactions;

  const visibleStats = (() => {
    const total = Math.abs(visibleTransactions.reduce((s, t) => s + t.amount, 0));
    const months = new Set(visibleTransactions.map((t) => t.date.slice(0, 7))).size;
    return { total, perMonth: months > 0 ? total / months : 0 };
  })();

  const activeCat = selectedCategory
    ? categories.find((c) => c.key === selectedCategory)
    : undefined;
  const catSegments = selectedCategory
    ? segments.filter((s) => s.category_key === selectedCategory)
    : [];

  return (
    <Group align="stretch" gap="md" style={{ flex: 1, height: '100%', minHeight: 0 }} wrap="nowrap">
      {/* Column 1: Categories */}
      <Box
        style={{
          width: 280,
          flexShrink: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!isReadOnly && (
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            size="xs"
            mb="xs"
            onClick={() => {
              setEditingCategory(undefined);
              setShowCategoryForm(true);
            }}
          >
            Ny kategori
          </Button>
        )}
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap={4}>
            {categories
              .filter((c) => c.key !== 'internal')
              .map((c) => {
                const Icon = (
                  TablerIcons as unknown as Record<
                    string,
                    React.ComponentType<{ size?: number; stroke?: number }>
                  >
                )[c.icon];
                const isActive = selectedCategory === c.key;
                return (
                  <Box
                    key={c.key}
                    component="button"
                    type="button"
                    onClick={() => handleSelectCategory(c.key)}
                    px="sm"
                    py={8}
                    style={{
                      borderRadius: 6,
                      background: isActive
                        ? 'var(--mantine-color-violet-0)'
                        : 'var(--mantine-color-default-hover)',
                      border: isActive
                        ? '1px solid var(--mantine-color-violet-3)'
                        : '1px solid transparent',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                        <ThemeIcon color={c.color} variant="light" size="sm" radius="sm">
                          {Icon ? <Icon size={13} stroke={1.5} /> : null}
                        </ThemeIcon>
                        <Text
                          size="sm"
                          fw={isActive ? 600 : 400}
                          style={{ color: isActive ? 'var(--mantine-color-violet-7)' : undefined }}
                          truncate
                        >
                          {c.label}
                        </Text>
                      </Group>
                      {!isReadOnly && (
                        <Group gap={2} wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(c);
                              setShowCategoryForm(true);
                            }}
                          >
                            <IconPencil size={12} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCategory(c.key);
                            }}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Group>
                  </Box>
                );
              })}
          </Stack>
        </ScrollArea>
      </Box>

      {/* Column 2: Segments */}
      <Box
        style={{
          width: 320,
          flexShrink: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {selectedCategory ? (
          <>
            {!isReadOnly && (
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                size="xs"
                mb="xs"
                onClick={() => handleAddSegment(selectedCategory)}
              >
                Nyt segment
              </Button>
            )}
            <ScrollArea style={{ flex: 1 }}>
              <Stack gap={4}>
                {/* "Vis alle" option */}
                <UnstyledButton
                  px="sm"
                  py={8}
                  onClick={() => setSelectedSegment(null)}
                  style={{
                    borderRadius: 6,
                    background:
                      selectedSegment === null
                        ? 'var(--mantine-color-violet-0)'
                        : 'var(--mantine-color-default-hover)',
                    border:
                      selectedSegment === null
                        ? '1px solid var(--mantine-color-violet-3)'
                        : '1px solid transparent',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Text
                      size="sm"
                      fw={selectedSegment === null ? 600 : 400}
                      style={{
                        color:
                          selectedSegment === null ? 'var(--mantine-color-violet-7)' : undefined,
                      }}
                    >
                      Vis alle
                    </Text>
                    <Badge variant="light" color="gray" size="xs" radius="sm">
                      {transactions.length}
                    </Badge>
                  </Group>
                </UnstyledButton>
                {catSegments.map((s) => {
                  const count = transactions.filter((t) => t.segment_key === s.key).length;
                  const isActive = selectedSegment === s.key;
                  return (
                    <UnstyledButton
                      key={s.id}
                      px="sm"
                      py={8}
                      onClick={() => setSelectedSegment(isActive ? null : s.key)}
                      style={{
                        borderRadius: 6,
                        background: isActive
                          ? 'var(--mantine-color-violet-0)'
                          : 'var(--mantine-color-default-hover)',
                        border: isActive
                          ? '1px solid var(--mantine-color-violet-3)'
                          : '1px solid transparent',
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Text
                          size="sm"
                          fw={isActive ? 600 : 400}
                          style={{ color: isActive ? 'var(--mantine-color-violet-7)' : undefined }}
                        >
                          {s.label}
                        </Text>
                        <Group gap={4} wrap="nowrap">
                          <Badge variant="light" color="gray" size="xs" radius="sm">
                            {count}
                          </Badge>
                          {!isReadOnly && (
                            <>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSegment(s);
                                  setSegmentCategoryKey(s.category_key);
                                  setShowSegmentForm(true);
                                }}
                              >
                                <IconPencil size={12} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSegment(s.id);
                                }}
                              >
                                <IconTrash size={12} />
                              </ActionIcon>
                            </>
                          )}
                        </Group>
                      </Group>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </ScrollArea>
          </>
        ) : (
          <Paper
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size="xs" c="dimmed" ta="center" px="md">
              Vælg en kategori
            </Text>
          </Paper>
        )}
      </Box>

      {/* Column 3: Transactions */}
      <Paper
        style={{
          flex: 1,
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {!selectedCategory ? (
          <Stack align="center" justify="center" style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">
              Vælg en kategori for at se transaktioner
            </Text>
          </Stack>
        ) : isLoading ? (
          <Stack gap={6} p="md">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} height={48} radius="sm" />
            ))}
          </Stack>
        ) : visibleTransactions.length === 0 ? (
          <Stack align="center" justify="center" style={{ flex: 1 }}>
            <Text size="sm" c="dimmed">
              Ingen transaktioner
            </Text>
          </Stack>
        ) : (
          <>
            <Group
              justify="space-between"
              align="center"
              px="sm"
              py="xs"
              style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', flexShrink: 0 }}
            >
              <Text size="xs" c="dimmed" fw={500}>
                {visibleTransactions.length} transaktioner
              </Text>
              <Group gap="lg" wrap="nowrap">
                <Stack gap={0} align="flex-end">
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={600}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    I alt
                  </Text>
                  <Text fw={700} style={{ fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    {formatDKK(visibleStats.total)}
                  </Text>
                </Stack>
                <Stack gap={0} align="flex-end">
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={600}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    Pr. md.
                  </Text>
                  <Text fw={700} style={{ fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    {formatDKK(visibleStats.perMonth)}
                  </Text>
                </Stack>
              </Group>
            </Group>
            <ScrollArea style={{ flex: 1 }} p="sm">
              <Stack gap={4}>
                {visibleTransactions.map((t) => {
                  const seg = segments.find(
                    (s) => s.key === t.segment_key && s.category_key === selectedCategory
                  );
                  const co = companies.find((c) => c.name === t.company_name);
                  return (
                    <Group
                      key={t.id}
                      justify="space-between"
                      wrap="nowrap"
                      px="sm"
                      py="xs"
                      onClick={() => setSelectedTransaction(t)}
                      style={{
                        borderRadius: 6,
                        background: 'var(--mantine-color-default-hover)',
                        cursor: 'pointer',
                      }}
                    >
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                        {t.company_name && (
                          <CompanyLogo
                            domain={co?.domain ?? t.company_domain}
                            name={t.company_name}
                            size={24}
                          />
                        )}
                        <Text size="sm" fw={500} truncate style={{ minWidth: 0 }}>
                          {t.company_name ?? t.description}
                        </Text>
                        {seg && (
                          <Badge
                            variant="light"
                            color="gray"
                            size="xs"
                            radius="sm"
                            style={{ flexShrink: 0 }}
                          >
                            {seg.label}
                          </Badge>
                        )}
                      </Group>
                      <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
                        <Text
                          size="sm"
                          fw={600}
                          c={t.amount < 0 ? 'red.6' : 'teal.6'}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {formatDKK(t.amount)}
                        </Text>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {formatDate(t.date)}
                        </Text>
                      </Group>
                    </Group>
                  );
                })}
              </Stack>
            </ScrollArea>
          </>
        )}
      </Paper>

      {/* Forms */}
      {!isReadOnly && showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          onSave={(data) => {
            if (editingCategory) updateCategory(data);
            else addCategory(data);
          }}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(undefined);
          }}
        />
      )}
      {!isReadOnly && showSegmentForm && (
        <SegmentForm
          segment={editingSegment}
          categoryKey={segmentCategoryKey}
          onSave={(data) => {
            if (editingSegment)
              updateSegment({
                id: editingSegment.id,
                label: data.label,
                description: data.description,
              });
            else addSegment(data);
          }}
          onClose={() => {
            setShowSegmentForm(false);
            setEditingSegment(undefined);
          }}
        />
      )}
      <TransactionDrawer
        transaction={selectedTransaction}
        categories={categories}
        segments={segments}
        onClose={() => setSelectedTransaction(null)}
      />
    </Group>
  );
}
