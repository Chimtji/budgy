'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Center,
  Checkbox,
  Group,
  Indicator,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import categories from '@/data/categories.json';
import months from '@/data/months.json';
import type { TCategoryName, TSegmentName } from '@/data/types';
import { TCompany } from '@/stores/companies/companiesStore';
import { capitalizeTitle } from '@/utilities';
import CompaniesSelect from '../CompaniesSelect/CompaniesSelect';
import CompanySelector from '../CompanySelector/CompanySelector';

const EditModal = <T extends Record<string, any>>({
  onClose,
  id,
  item,
  onLeftButtonClick,
  onRightButtonClick,
  onDelete,
  fetchOccurences,
  leftButtonLabel,
  rightButtonLabel,
}: {
  id: string;
  leftButtonLabel: string;
  rightButtonLabel?: string;
  item: T;
  onDelete?: (id: string) => void;
  onClose: () => void;
  fetchOccurences?: (id: string) => Promise<string[]>;
  onLeftButtonClick: (item: T, id: string) => void;
  onRightButtonClick?: (item: T, occurencesIds: string[]) => void;
}) => {
  const [opened, { open, close }] = useDisclosure(true);
  const [loadingSingle, setLoadingSingle] = useState<boolean>(false);
  const [loadingMultiple, setLoadingMultiple] = useState<boolean>(false);
  const [occurences, setOccurences] = useState<string[]>([]);

  const [amount, setAmount] = useState<number | string>(item.amount);
  const [company, setCompany] = useState<TCompany>(item.company);
  const [segment, setSegment] = useState<TSegmentName>(item.segment);
  const [category, setCategory] = useState<TCategoryName>(item.category);
  const [description, setDescription] = useState<string>(item.description);
  const [due, setDue] = useState<string[]>(item.due);

  useEffect(() => {
    if (onRightButtonClick && fetchOccurences) {
      fetchOccurences(id).then((response) => setOccurences(response));
    }
  }, []);

  const getSegmentsOfCategory = (): { value: string; label: string }[] => {
    const segments = categories[category].segments;

    const result = Object.entries(segments).map(([id, data]) => ({
      value: id,
      label: capitalizeTitle(data.label),
    }));

    return result;
  };

  const createUpdatedItem = () => ({
    ...item,
    ...(amount && { amount }),
    ...(description && { description }),
    ...(company && { company }),
    ...(segment && { segment }),
    ...(category && { category }),
    ...(due && { due }),
  });

  const handleLeftButton = () => {
    setLoadingSingle(true);
    onLeftButtonClick(createUpdatedItem(), id);
    setLoadingSingle(false);
    handleClose();
  };

  const handleRightButton = () => {
    setLoadingMultiple(true);

    onRightButtonClick?.(createUpdatedItem(), occurences);

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
        <Title>Redigér</Title>
        {item.amount && (
          <NumberInput value={amount} label="Beløb" onChange={setAmount} suffix=" Kr." />
        )}
        {item.company && <CompanySelector onChange={setCompany} />}
        {item.description && (
          <TextInput
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            label="Beskrivelse"
            placeholder="Skriv Beskrivelse"
          />
        )}
        {item.category && (
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
        )}
        {item.segment && (
          <Select
            value={segment}
            data={category ? getSegmentsOfCategory() : []}
            label="Segment"
            disabled={!category}
            placeholder="Vælg Segment"
            onChange={(val) => setSegment(val as TSegmentName)}
          />
        )}
        {item.due && (
          <Checkbox.Group label="Betales" onChange={setDue} value={due}>
            <Group mt="xs">
              {Object.entries(months).map(([id, data]) => (
                <Checkbox value={id} label={data.label} key={id as string} />
              ))}
            </Group>
          </Checkbox.Group>
        )}
        <Center mt="lg">
          <Group>
            <Button variant="subtle" onClick={handleLeftButton} loading={loadingSingle}>
              {leftButtonLabel}
            </Button>
            {onRightButtonClick && rightButtonLabel && (
              <Indicator label={Object.keys(occurences).length} size={20} color="indigo">
                <Button variant="filled" onClick={handleRightButton} loading={loadingMultiple}>
                  {rightButtonLabel}
                </Button>
              </Indicator>
            )}
            {onDelete && (
              <Button variant="subtle" color="red" onClick={() => onDelete(id)}>
                Slet
              </Button>
            )}
          </Group>
        </Center>
      </Stack>
    </Modal>
  );
};

export default EditModal;
