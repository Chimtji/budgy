import { useState } from 'react';
import { Button, Center, Drawer, Fieldset, Group, NumberInput, Stack, TextInput, Title } from '@mantine/core';
import CategorySelector from '@/app/(dashboard)/_components/CategorySelector/CategorySelector';
import CompanySelector from '@/app/(dashboard)/_components/CompanySelector/CompanySelector';
import SegmentSelector from '@/app/(dashboard)/_components/SegmentSelector/SegmentSelector';
import CadenceSelector from '@/app/(dashboard)/_components/CadenceSelector/CadenceSelector';
import { TCategoryName, TMonthIndex, TSegmentName } from '@/data/types';
import { TCompany } from '@/stores/companies/companiesStore';

export type TBillModalReturn = {
  amount: number | string;
  segment: TSegmentName;
  category: TCategoryName;
  due: TMonthIndex[];
  company: TCompany;
  name: string;
};

export type TBillModalProps = {
  opened: boolean;
  title: string;
  data?: TBillModalReturn;
  close: () => void;
  rightActionLabel: string;
  onRightAction: ({ amount, segment, category, due, company }: TBillModalReturn) => void;
  leftActionLabel?: string;
  onLeftAction?: ({ amount, segment, category, due, company }: TBillModalReturn) => void;
};

const BillModal = ({
  title,
  opened,
  data,
  leftActionLabel,
  rightActionLabel,
  onLeftAction,
  onRightAction,
  close,
}: TBillModalProps) => {
  const [name, setName] = useState<string>(data?.name || '');
  const [amount, setAmount] = useState<number | string>(data?.amount || 0);
  const [segment, setSegment] = useState<TSegmentName>(data?.segment || 'uncategorized');
  const [category, setCategory] = useState<TCategoryName>(data?.category || 'uncategorized');
  const [due, setDue] = useState<TMonthIndex[]>(data?.due || []);
  const [company, setCompany] = useState<TCompany>(
    data?.company || {
      name: '',
      domain: '',
      description: '',
      id: 0,
    }
  );

  const handleRightAction = () => {
    onRightAction?.({ amount, segment, category, due, company, name });
    close();
  };

  const handleLeftAction = () => {
    onLeftAction?.({ amount, segment, category, due, company, name });
    close();
  };

  return (
    <Drawer
      opened={opened}
      onClose={close}
      position="right"
      size="lg"
      title={<Title order={2}>{title}</Title>}
      zIndex={300}
    >
      <Stack pl="xl" pr="xl" pb="md" pt="md" gap="md" h="100%">
        <Stack gap="md" style={{ flex: 1 }}>
          <Fieldset legend="Regning" h="100%">
            <Stack>
              <TextInput
                value={name}
                label="Navn"
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <CompanySelector value={company} onChange={(chosen) => setCompany(chosen)} />
            </Stack>
          </Fieldset>
          <Fieldset legend="Betaling" h="100%">
            <Stack>
              <NumberInput value={amount} label="Beløb" suffix=" Kr." onChange={setAmount} />
              <CadenceSelector value={due} onChange={setDue} />
            </Stack>
          </Fieldset>
          <Fieldset legend="Budgettering" h="100%">
            <Stack>
              <CategorySelector value={category} onChange={(chosen) => setCategory(chosen.value)} />
              <SegmentSelector
                category={category}
                value={segment}
                onChange={(chosen) => setSegment(chosen.value)}
              />
            </Stack>
          </Fieldset>
        </Stack>
        <Group justify="flex-end">
          {leftActionLabel && (
            <Button variant="subtle" onClick={handleLeftAction}>
              {leftActionLabel}
            </Button>
          )}
          <Button variant="filled" onClick={handleRightAction}>
            {rightActionLabel}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};

export default BillModal;
