import { useState } from 'react';
import {
  Button,
  Center,
  Checkbox,
  Fieldset,
  Group,
  Modal,
  NumberInput,
  Stack,
  Title,
} from '@mantine/core';
import CategorySelector from '@/app/(dashboard)/_components/CategorySelector/CategorySelector';
import CompanySelector from '@/app/(dashboard)/_components/CompanySelector/CompanySelector';
import SegmentSelector from '@/app/(dashboard)/_components/SegmentSelector/SegmentSelector';
import { toMonthIndexNumbers, toMonthIndexStrings } from '@/data/helpers';
import months from '@/data/months.json';
import { TCategoryName, TMonthIndex, TSegmentName } from '@/data/types';
import { TCompany } from '@/stores/companies/companiesStore';

export type TBillModalReturn = {
  amount: number | string;
  segment: TSegmentName;
  category: TCategoryName;
  due: TMonthIndex[];
  company: TCompany;
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
  const [amount, setAmount] = useState<number | string>(data?.amount || 0);
  const [segment, setSegment] = useState<TSegmentName>(data?.segment || 'uncategorized');
  const [category, setCategory] = useState<TCategoryName>(data?.category || 'uncategorized');
  const [due, setDue] = useState<string[]>(toMonthIndexStrings(data?.due || []));
  const [company, setCompany] = useState<TCompany>(
    data?.company || {
      name: '',
      domain: '',
      description: '',
      id: 0,
    }
  );

  const handleRightAction = () => {
    onRightAction?.({ amount, segment, category, due: toMonthIndexNumbers(due), company });
  };

  const handleLeftAction = () => {
    onLeftAction?.({ amount, segment, category, due: toMonthIndexNumbers(due), company });
  };

  return (
    <Modal
      size="60%"
      opened={opened}
      onClose={close}
      centered
      zIndex={300}
      closeButtonProps={{ onClick: close }}
    >
      <Stack pl="xl" pr="xl" pb="md">
        <Title order={3}>{title}</Title>
        <Group grow align="start">
          <Fieldset legend="Pris" h="100%">
            <Stack>
              <NumberInput value={amount} label="Beløb" suffix=" Kr." onChange={setAmount} />
              <Checkbox.Group label="Betales" onChange={setDue} value={due}>
                <Group mt="xs">
                  {Object.entries(months).map(([id, data]) => (
                    <Checkbox value={id} label={data.label} key={id as string} />
                  ))}
                </Group>
              </Checkbox.Group>
            </Stack>
          </Fieldset>
          <Fieldset legend="Budgettering" h="100%">
            <Stack>
              <CompanySelector onChange={(chosen) => setCompany(chosen)} />
              <CategorySelector onChange={(chosen) => setCategory(chosen.value)} />
              <SegmentSelector
                category={category}
                onChange={(chosen) => setSegment(chosen.value)}
              />
            </Stack>
          </Fieldset>
        </Group>
        <Center>
          <Group>
            {leftActionLabel && (
              <Button variant="subtle" onClick={handleLeftAction}>
                {leftActionLabel}
              </Button>
            )}
            <Button variant="filled" onClick={handleRightAction}>
              {rightActionLabel}
            </Button>
          </Group>
        </Center>
      </Stack>
    </Modal>
  );
};

export default BillModal;
