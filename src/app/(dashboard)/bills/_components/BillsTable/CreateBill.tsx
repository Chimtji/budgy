import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
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
import { useDisclosure } from '@mantine/hooks';
import CategorySelector from '@/app/(dashboard)/_components/CategorySelector/CategorySelector';
import CompanySelector from '@/app/(dashboard)/_components/CompanySelector/CompanySelector';
import SegmentSelector from '@/app/(dashboard)/_components/SegmentSelector/SegmentSelector';
import months from '@/data/months.json';
import { TCategoryName, TSegmentName } from '@/data/types';
import { useAppStore } from '@/stores/app/appStore';
import { useBillsStore } from '@/stores/bills/billsStore';
import { TCompany } from '@/stores/companies/companiesStore';
import BillModal, { TBillModalProps, TBillModalReturn } from './BillModal';

const CreateBill = ({}) => {
  const [opened, { open, close }] = useDisclosure(false);

  const { addBill } = useBillsStore(
    useShallow((state) => ({
      addBill: state.add,
    }))
  );

  const year = useAppStore((state) => state.year);

  const handleCreate: TBillModalProps['onRightAction'] = async ({
    amount,
    segment,
    category,
    due,
    company,
  }) => {
    addBill({
      amount: Number(amount),
      category,
      segment,
      due: due as any,
      companyId: company.id,
      companyName: company.name,
      companyDomain: company.domain,
      year: year,
    });
    close();
  };

  const handleClose = async () => {
    close();
  };

  return (
    <>
      <Button variant="light" onClick={open}>
        Opret
      </Button>
      <BillModal
        close={close}
        onRightAction={(val) => handleCreate(val)}
        rightActionLabel="Opret"
        title="Opret Regning"
        opened={opened}
      />
    </>
  );
};

export default CreateBill;
