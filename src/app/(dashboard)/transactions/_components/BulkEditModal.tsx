'use client';

import { useState } from 'react';
import { Button, Drawer, Group, Select, Stack, Text } from '@mantine/core';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import CompanyLogo from '../../companies/_components/CompanyLogo';

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

type TProps = {
  opened: boolean;
  count: number;
  categories: TCategory[];
  segments: TSegment[];
  onClose: () => void;
  onSave: (input: {
    category_key: string;
    segment_key: string;
    company_name: string | null;
  }) => void;
};

const BulkEditModal: React.FC<TProps> = ({
  opened,
  count,
  categories,
  segments,
  onClose,
  onSave,
}) => {
  const companies = useCompaniesStore((s) => s.companies);
  const [categoryKey, setCategoryKey] = useState('');
  const [segmentKey, setSegmentKey] = useState('');
  const [companyName, setCompanyName] = useState<string | null>(null);

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.label }));
  const segmentOptions = segments
    .filter((s) => s.category_key === categoryKey)
    .map((s) => ({ value: s.key, label: s.label }));
  const uniqueCompanies = Array.from(new Map(companies.map((c) => [c.name, c])).values());
  const companyOptions = uniqueCompanies.map((c) => ({
    value: c.name,
    label: c.name,
    domain: c.domain ?? null,
  }));

  const handleClose = () => {
    setCategoryKey('');
    setSegmentKey('');
    setCompanyName(null);
    onClose();
  };

  const handleSave = () => {
    onSave({ category_key: categoryKey, segment_key: segmentKey, company_name: companyName });
    handleClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title={`Masseredigér ${count} transaktioner`}
      position="right"
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Kun udfyldte felter anvendes. Kategori og segment sættes altid (brug evt. blankt segment).
        </Text>
        <Select
          label="Virksomhed"
          data={companyOptions}
          value={companyName}
          onChange={setCompanyName}
          searchable
          clearable
          placeholder="Vælg virksomhed (valgfrit)"
          renderOption={({ option }) => {
            const co = companyOptions.find((c) => c.value === option.value);
            return (
              <Group gap="sm">
                <CompanyLogo domain={co?.domain ?? null} name={option.label} size={20} />
                <Text size="sm">{option.label}</Text>
              </Group>
            );
          }}
        />
        <Select
          label="Kategori"
          data={categoryOptions}
          value={categoryKey || null}
          onChange={(v) => {
            setCategoryKey(v ?? '');
            setSegmentKey('');
          }}
          searchable
          clearable
          placeholder="Vælg kategori"
        />
        <Select
          label="Segment"
          data={segmentOptions}
          value={segmentKey || null}
          onChange={(v) => setSegmentKey(v ?? '')}
          searchable
          clearable
          placeholder="Vælg segment"
          disabled={!categoryKey}
        />
        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="subtle" color="gray" onClick={handleClose}>
            Annuller
          </Button>
          <Button onClick={handleSave} disabled={!categoryKey}>
            Gem {count} transaktioner
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};

export default BulkEditModal;
