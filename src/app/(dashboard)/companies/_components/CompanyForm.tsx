'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from '@mantine/core';
import { TParsedRow } from '../../import/page';
import CompanyLogo from './CompanyLogo';

type TCategory = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};
type TSegment = { key: string; category_key: string; label: string };
type TCompany = {
  id: string;
  name: string;
  domain: string | null;
  tags: string[];
  category_key: string | null;
  segment_key: string | null;
};

type TProps = {
  company?: TCompany;
  transaction?: TParsedRow | null;
  categories: TCategory[];
  segments: TSegment[];
  onSave: (
    name: string,
    domain: string | null,
    tags: string[],
    category_key: string | null,
    segment_key: string | null
  ) => void;
  onClose: () => void;
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(amount);

const CompanyForm: React.FC<TProps> = ({
  company,
  transaction,
  categories,
  segments,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(company?.name ?? '');
  const [domain, setDomain] = useState(company?.domain ?? '');
  const [tags, setTags] = useState<string[]>(company?.tags ?? []);
  const [categoryKey, setCategoryKey] = useState<string | null>(company?.category_key ?? null);
  const [segmentKey, setSegmentKey] = useState<string | null>(company?.segment_key ?? null);
  const domainEditedRef = { current: !!company?.domain };

  useEffect(() => {
    setName(company?.name ?? '');
    setDomain(company?.domain ?? '');
    setTags(company?.tags ?? []);
    setCategoryKey(company?.category_key ?? null);
    setSegmentKey(company?.segment_key ?? null);
    domainEditedRef.current = !!company?.domain;
  }, [company]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!domainEditedRef.current) {
      setDomain(value.trim().toLowerCase().replace(/\s+/g, '') + '.dk');
    }
  };

  const handleCategoryChange = (val: string | null) => {
    setCategoryKey(val);
    setSegmentKey(null);
  };

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.label }));
  const segmentOptions = segments
    .filter((s) => s.category_key === categoryKey)
    .map((s) => ({ value: s.key, label: s.label }));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), domain.trim() || null, tags, categoryKey, segmentKey);
    onClose();
  };

  const matchedCategory = transaction?.category_key
    ? categories.find((category) => category.key === transaction.category_key)
    : null;
  const matchedSegment = transaction?.segment_key
    ? segments.find(
        (segment) =>
          segment.key === transaction.segment_key &&
          segment.category_key === transaction.category_key
      )
    : null;

  return (
    <Modal
      opened
      onClose={onClose}
      title={company ? 'Rediger virksomhed' : 'Ny virksomhed'}
      size={transaction ? 'xl' : 'md'}
    >
      <Group align="flex-start" wrap="nowrap" gap="xl">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Stack gap="md">
            <Group gap="md" align="flex-end">
              <CompanyLogo domain={domain.trim() || null} name={name || '?'} size={48} />
              <TextInput
                label="Navn"
                placeholder="f.eks. Netto"
                value={name}
                onChange={(e) => handleNameChange(e.currentTarget.value)}
                data-autofocus
                style={{ flex: 1 }}
              />
            </Group>
            <TextInput
              label="Domæne"
              placeholder="f.eks. netto.com"
              value={domain}
              onChange={(e) => {
                domainEditedRef.current = true;
                setDomain(e.currentTarget.value);
              }}
              description="Bruges til at vise virksomhedslogo (valgfrit)"
            />
            <Group gap="sm" grow>
              <Select
                label="Standard kategori"
                placeholder="Vælg kategori"
                data={categoryOptions}
                value={categoryKey}
                onChange={handleCategoryChange}
                clearable
              />
              <Select
                label="Standard segment"
                placeholder="Vælg segment"
                data={segmentOptions}
                value={segmentKey}
                onChange={setSegmentKey}
                clearable
                disabled={!categoryKey}
              />
            </Group>
            <TagsInput
              label="Søgeord"
              placeholder="Tilføj søgeord og tryk Enter"
              value={tags}
              onChange={setTags}
              description="Bruges til automatisk at genkende transaktioner ved import"
              splitChars={[',']}
            />
            <Text size="xs" c="dimmed">
              Tip: tilføj ord der typisk optræder i transaktionsbeskrivelsen, f.eks.
              &quot;netto&quot; eller &quot;supermarked&quot;
            </Text>
            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={onClose}>
                Annuller
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()}>
                Gem
              </Button>
            </Group>
          </Stack>
        </Box>
        {transaction && (
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Stack gap="sm">
              <Text
                size="xs"
                c="dimmed"
                tt="uppercase"
                fw={700}
                style={{ letterSpacing: '0.06em' }}
              >
                Transaktion
              </Text>

              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  Beløb
                </Text>
                <Text fw={700} c={transaction.amount < 0 ? 'red.6' : 'teal.6'}>
                  {formatAmount(transaction.amount)}
                </Text>
              </div>

              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  Dato
                </Text>
                <Text size="sm">{new Date(transaction.date).toLocaleDateString('da-DK')}</Text>
              </div>

              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  Beskrivelse
                </Text>
                <Text size="sm">{transaction.description}</Text>
              </div>

              {transaction.recipient && (
                <div>
                  <Text size="xs" c="dimmed" mb={4}>
                    Modpart
                  </Text>
                  <Text size="sm">{transaction.recipient}</Text>
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
          </Box>
        )}
      </Group>
    </Modal>
  );
};

export default CompanyForm;
