'use client';

import { useEffect, useState } from 'react';
import { IconMenuDeep, IconSearch } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { Button, Group, Indicator, Stack, Text, TextInput, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { TTransactions, useTransactionsStore } from '@/stores/transactions/transactionsStore';
import TransactionsTable from './_components/Table';

type TProps = {};

const Transactions: React.FC<TProps> = () => {
  const { transactions, pending, searchTransactions } = useTransactionsStore(
    useShallow((state) => ({
      transactions: state.transactions,
      pending: state.pendingTransactions,
      searchTransactions: state.searchTransactions,
    }))
  );

  const attention = Object.keys(pending).length > 0;

  const [filteredData, setFilteredData] = useState<TTransactions>(transactions);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 200);

  useEffect(() => {
    setFilteredData(transactions);
  }, [transactions]);

  useEffect(() => {
    filterDatabySearch(search);
  }, [debouncedSearch, transactions]);

  const filterDatabySearch = (query: string) => {
    searchTransactions(query).then((result) => {
      setFilteredData(result);
    });
  };

  const filterByAttention = () => {
    setFilteredData(pending);
    setSearch('');
  };

  const resetFilters = () => {
    setFilteredData(transactions);
  };

  return (
    <Stack h="100vh" p="xl">
      <Group>
        <IconMenuDeep size={30} />
        <Title order={2}>Transaktioner</Title>
      </Group>
      <Group justify="space-between">
        <Group>
          <TextInput
            radius="md"
            placeholder="Search.."
            leftSection={<IconSearch size={20} />}
            variant="filled"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
            }}
            rightSection={<Text>{Object.keys(filteredData).length}</Text>}
            styles={{
              input: {
                backgroundColor: `var(--mantine-color-dark-9)`,
              },
            }}
          />
          <Button color={'blue'} variant="light" onClick={resetFilters} radius="md">
            Fjern Filtre
          </Button>
        </Group>
        <Group>
          {attention ? (
            <Indicator label={Object.keys(pending).length} color="yellow" size={20}>
              <Button color={'yellow'} variant="light" onClick={filterByAttention} radius="md">
                Kræver Handling
              </Button>
            </Indicator>
          ) : (
            <Button color={'green'} variant="light">
              Alt er fint
            </Button>
          )}
        </Group>
      </Group>

      <TransactionsTable data={filteredData} />
    </Stack>
  );
};

export default Transactions;
