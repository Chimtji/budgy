'use client';

import { useEffect, useState } from 'react';
import { Button, Drawer, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { type TTransaction } from '@/service/database/transactions/getAll';
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
  transaction: TTransaction | null;
  categories: TCategory[];
  segments: TSegment[];
  onClose: () => void;
  onSave: (input: {
    id: string;
    date: string;
    amount: number;
    description: string;
    recipient: string;
    category_key: string;
    segment_key: string;
    company_name: string | null;
  }) => void;
};

const EditTransactionDrawer: React.FC<TProps> = ({
  transaction,
  categories,
  segments,
  onClose,
  onSave,
}) => {
  const companies = useCompaniesStore((s) => s.companies);
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [categoryKey, setCategoryKey] = useState('');
  const [segmentKey, setSegmentKey] = useState('');

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setAmount(transaction.amount);
      setDescription(transaction.description);
      setRecipient(transaction.recipient ?? '');
      setCompanyName(transaction.company_name ?? null);
      setCategoryKey(transaction.category_key ?? '');
      setSegmentKey(transaction.segment_key ?? '');
    }
  }, [transaction]);

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

  const handleCategoryChange = (value: string | null) => {
    setCategoryKey(value ?? '');
    setSegmentKey('');
  };

  const handleSave = () => {
    if (!transaction) return;
    onSave({
      id: transaction.id,
      date,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      description,
      recipient,
      company_name: companyName,
      category_key: categoryKey,
      segment_key: segmentKey,
    });
    onClose();
  };

  return (
    <Drawer
      opened={!!transaction}
      onClose={onClose}
      title="Rediger transaktion"
      position="right"
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label="Dato"
          type="date"
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
        />
        <NumberInput
          label="Beløb"
          value={amount}
          onChange={setAmount}
          decimalScale={2}
          step={0.01}
        />
        <TextInput
          label="Beskrivelse"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
        <TextInput
          label="Modpart"
          value={recipient}
          onChange={(e) => setRecipient(e.currentTarget.value)}
        />
        <Select
          label="Virksomhed"
          data={companyOptions}
          value={companyName}
          onChange={setCompanyName}
          searchable
          clearable
          placeholder="Vælg virksomhed"
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
          onChange={handleCategoryChange}
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
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Annuller
          </Button>
          <Button onClick={handleSave}>Gem</Button>
        </Group>
      </Stack>
    </Drawer>
  );
};

export default EditTransactionDrawer;
