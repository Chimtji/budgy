'use client';

import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import {
  Button,
  Center,
  Group,
  Indicator,
  Modal,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import categories from '@/data/categories.json';
import type { TCategoryName, TSegmentName } from '@/data/types';
import { TCompany } from '@/stores/companies/companiesStore';
import { useTransactionsStore, type TTransaction } from '@/stores/transactions/transactionsStore';
import { capitalizeTitle } from '@/utilities';
import CompaniesSelect from '../../_components/CompaniesSelect/CompaniesSelect';

const EditModal = ({
  onClose,
  transaction,
  occurences,
}: {
  transaction: TTransaction;
  onClose: () => void;
  occurences: string[];
}) => {
  const { editTransaction, editTransactionOccurences, getIdOfTransaction } = useTransactionsStore(
    useShallow((state) => ({
      editTransaction: state.editTransaction,
      editTransactionOccurences: state.editTransactionOccurences,
      getIdOfTransaction: state.getIdOfTransaction,
    }))
  );

  const [loadingSingle, setLoadingSingle] = useState<boolean>(false);
  const [loadingMultiple, setLoadingMultiple] = useState<boolean>(false);
  const [opened, { open, close }] = useDisclosure(true);
  const [description, setDescription] = useState<string>(transaction.description);
  const [company, setCompany] = useState<TCompany>(transaction.company);
  const [segment, setSegment] = useState<TSegmentName>(transaction.segment);
  const [category, setCategory] = useState<TCategoryName>(transaction.category);

  const getSegmentsOfCategory = (): { value: string; label: string }[] => {
    const segments = categories[category].segments;

    const result = Object.entries(segments).map(([id, data]) => ({
      value: id,
      label: capitalizeTitle(data.label),
    }));

    return result;
  };

  const editSingle = () => {
    setLoadingSingle(true);

    getIdOfTransaction(transaction).then((id) => {
      if (id === '') {
        return;
      }

      const updatedTransaction: TTransaction = {
        ...transaction,
        description,
        company,
        segment,
        category,
      };

      editTransaction(id, updatedTransaction);

      setLoadingSingle(false);
      handleClose();
    });
  };
  const editAll = () => {
    setLoadingMultiple(true);

    const updatedTransaction: TTransaction = {
      ...transaction,
      description,
      company,
      segment,
      category,
    };

    editTransactionOccurences(updatedTransaction, occurences);

    setLoadingMultiple(false);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    close();
  };

  return (
    <Modal opened={opened} onClose={handleClose} centered zIndex={300}>
      <Stack pl="xl" pr="xl" pb="md">
        <Title>Redigér Transaktion</Title>
        <CompaniesSelect val={company} onChange={setCompany} />
        <TextInput
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          label="Beskrivelse"
          placeholder="Skriv Beskrivelse"
        />
        <Select
          value={category}
          data={Object.entries(categories).map(([id, data]) => ({
            value: id,
            label: capitalizeTitle(data.label),
          }))}
          onChange={(val) => setCategory(val as TCategoryName)}
          label="Kategori"
          placeholder="Vælg Kategori"
        />
        <Select
          value={segment}
          data={category ? getSegmentsOfCategory() : []}
          label="Segment"
          disabled={!category}
          placeholder="Vælg Segment"
          onChange={(val) => setSegment(val as TSegmentName)}
        />
        <Center mt="lg">
          <Group>
            <Button variant="subtle" onClick={editSingle} loading={loadingSingle}>
              Opdater Denne
            </Button>
            <Indicator label={Object.keys(occurences).length} size={20} color="indigo">
              <Button variant="filled" onClick={editAll} loading={loadingMultiple}>
                Opdater Alle
              </Button>
            </Indicator>
          </Group>
        </Center>
      </Stack>
    </Modal>
  );
};

export default EditModal;
