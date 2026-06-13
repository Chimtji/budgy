'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import type { TTransaction } from '@/service/database/transactions/getAll';

declare global {
  interface Window {
    __budgyPendingCompanyTransaction?: TTransaction | null;
  }
}

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

type TCompany = {
  id?: string;
  name: string;
  domain: string | null;
  tags: string[];
  category_key: string | null;
  segment_key: string | null;
};

type TTransactionContext = {
  date: string;
  amount: number;
  description: string;
  recipient: string | null;
  balance?: number | null;
  supp_text?: string | null;
  category_key?: string | null;
  segment_key?: string | null;
  company_name?: string | null;
};

type TProps = {
  categories: TCategory[];
  segments: TSegment[];
  company?: TCompany;
  transaction?: TTransaction | null;
  transactionContext?: TTransactionContext | null;
  onSave: (
    name: string,
    domain: string | null,
    tags: string[],
    category_key: string | null,
    segment_key: string | null
  ) => void;
  onClose: () => void;
};

const normalizeDomain = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  return trimmed
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(amount);

const CompanyForm: React.FC<TProps> = ({
  categories,
  segments,
  company,
  transaction,
  transactionContext,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(
    company?.name ?? transaction?.company_name ?? transactionContext?.company_name ?? ''
  );
  const [domain, setDomain] = useState(company?.domain ?? '');
  const [tags, setTags] = useState(company?.tags.join(', ') ?? '');
  const [categoryKey, setCategoryKey] = useState<string | null>(company?.category_key ?? null);
  const [segmentKey, setSegmentKey] = useState<string | null>(company?.segment_key ?? null);
  const fallbackTransaction =
    typeof window !== 'undefined' ? window.__budgyPendingCompanyTransaction ?? null : null;
  const activeTransaction = transaction ?? fallbackTransaction ?? transactionContext ?? null;

  useEffect(() => {
    setName(company?.name ?? activeTransaction?.company_name ?? '');
    setDomain(company?.domain ?? '');
    setTags(company?.tags.join(', ') ?? '');
    setCategoryKey(company?.category_key ?? activeTransaction?.category_key ?? null);
    setSegmentKey(company?.segment_key ?? activeTransaction?.segment_key ?? null);
  }, [company, activeTransaction]);

  const segmentOptions = useMemo(
    () =>
      segments
        .filter((segment) => segment.category_key === categoryKey)
        .map((segment) => ({ value: segment.key, label: segment.label })),
    [segments, categoryKey]
  );

  const matchedCategory = activeTransaction?.category_key
    ? categories.find((category) => category.key === activeTransaction.category_key)
    : null;
  const matchedSegment = activeTransaction?.segment_key
    ? segments.find(
        (segment) =>
          segment.key === activeTransaction.segment_key &&
          segment.category_key === activeTransaction.category_key
      )
    : null;

  const handleSave = () => {
    if (!name.trim()) return;

    onSave(
      name.trim(),
      normalizeDomain(domain) ?? null,
      tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      categoryKey,
      segmentKey
    );
    if (typeof window !== 'undefined') {
      window.__budgyPendingCompanyTransaction = null;
    }
    onClose();
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.__budgyPendingCompanyTransaction = null;
    }
    onClose();
  };

  return (
    <Modal opened onClose={handleClose} title={company ? 'Rediger virksomhed' : 'Ny virksomhed'} size={activeTransaction ? 'xl' : 'lg'}>
      <Group align="flex-start" wrap="nowrap" gap="xl">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Stack gap="md">
            <TextInput
              label="Navn"
              placeholder="Virksomhedsnavn"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              required
              autoFocus
            />

            <TextInput
              label="Domæne"
              placeholder="eksempel.dk"
              value={domain}
              onChange={(event) => setDomain(event.currentTarget.value)}
            />

            <TextInput
              label="Tags"
              placeholder="kommaseparerede mønstre"
              value={tags}
              onChange={(event) => setTags(event.currentTarget.value)}
            />

            <Select
              label="Kategori"
              placeholder="Vælg kategori"
              data={categories.map((category) => ({ value: category.key, label: category.label }))}
              value={categoryKey}
              onChange={(value) => {
                setCategoryKey(value);
                setSegmentKey(null);
              }}
              clearable
              searchable
            />

            <Select
              label="Segment"
              placeholder="Vælg segment"
              data={segmentOptions}
              value={segmentKey}
              onChange={setSegmentKey}
              clearable
              searchable
              disabled={!categoryKey}
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={handleClose}>
                Annuller
              </Button>
              <Button onClick={handleSave}>{company ? 'Gem' : 'Opret'}</Button>
            </Group>
          </Stack>
        </Box>

        {activeTransaction && (
          <>
            <Divider orientation="vertical" />
            <Paper withBorder p="md" style={{ width: 320, flexShrink: 0 }}>
              <Stack gap="sm">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.06em' }}>
                  Transaktion
                </Text>

                <div>
                  <Text size="xs" c="dimmed" mb={4}>
                    Beløb
                  </Text>
                  <Text fw={700} c={activeTransaction.amount < 0 ? 'red.6' : 'teal.6'}>
                    {formatAmount(activeTransaction.amount)}
                  </Text>
                </div>

                <div>
                  <Text size="xs" c="dimmed" mb={4}>
                    Dato
                  </Text>
                  <Text size="sm">{new Date(activeTransaction.date).toLocaleDateString('da-DK')}</Text>
                </div>

                <div>
                  <Text size="xs" c="dimmed" mb={4}>
                    Beskrivelse
                  </Text>
                  <Text size="sm">{activeTransaction.description}</Text>
                </div>

                {activeTransaction.recipient && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      Modpart
                    </Text>
                    <Text size="sm">{activeTransaction.recipient}</Text>
                  </div>
                )}

                {(matchedCategory || matchedSegment) && (
                  <Group gap="xs">
                    {matchedCategory && (
                      <Badge color={matchedCategory.color} variant="light" radius="sm" size="sm">
                        {matchedCategory.label}
                      </Badge>
                    )}
                    {matchedSegment && (
                      <Badge color="gray" variant="light" radius="sm" size="sm">
                        {matchedSegment.label}
                      </Badge>
                    )}
                  </Group>
                )}
              </Stack>
            </Paper>
          </>
        )}
      </Group>
    </Modal>
  );
};

export default CompanyForm;