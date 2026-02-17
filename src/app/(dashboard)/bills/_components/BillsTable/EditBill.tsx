import { IconDots } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAppStore } from '@/stores/app/appStore';
import { useBillsStore } from '@/stores/bills/billsStore';
import BillModal, { TBillModalProps } from './BillModal';
import { TBillRow } from './BillsTable.types';

const EditBill = ({ bill }: { bill: TBillRow }) => {
  const [opened, { open, close }] = useDisclosure(false);

  const { edit, deleteBill } = useBillsStore(
    useShallow((state) => ({
      edit: state.edit,
      deleteBill: state.delete,
    }))
  );

  const year = useAppStore((state) => state.year);

  const handleEdit: TBillModalProps['onRightAction'] = ({
    amount,
    category,
    segment,
    due,
    company,
  }) => {
    edit(
      {
        amount: Number(amount),
        category,
        segment,
        due,
        year,
        companyId: company.id,
        companyName: company.name,
        companyDomain: company.domain,
      },
      bill.id
    );
    close();
  };
  const handleDelete = () => {
    deleteBill(bill.id);
    close();
  };

  return (
    <>
      <ActionIcon radius="xl" variant="subtle" color="dark" onClick={open}>
        <IconDots />
      </ActionIcon>
      <BillModal
        data={{
          amount: bill.amount,
          category: bill.category,
          segment: bill.segment,
          due: bill.due,
          company: {
            id: bill.companyId,
            name: bill.companyName,
            domain: bill.companyDomain,
            description: '',
          },
        }}
        onLeftAction={handleDelete}
        onRightAction={(val) => handleEdit(val)}
        close={close}
        leftActionLabel="Slet"
        rightActionLabel="Redigér"
        title="Redigér Regning"
        opened={opened}
      />
    </>
  );
};

export default EditBill;
