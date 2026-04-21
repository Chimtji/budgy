import { IconDots, IconDotsVertical } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { ActionIcon } from '@mantine/core';
import { useAppStore } from '@/stores/app/appStore';
import { useBillsStore } from '@/stores/bills/billsStore';
import BillModal, { TBillModalProps } from './BillModal';
import { TBillRow } from './BillsTable.types';

type TEditBillProps = {
  bill: TBillRow;
  opened: boolean;
  open: () => void;
  close: () => void;
};

const EditBill = ({ bill, opened, open, close }: TEditBillProps) => {
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
    name,
  }) => {
    edit(
      {
        amount: Number(amount),
        category,
        segment,
        due,
        year,
        name,
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
      <ActionIcon
        radius="xl"
        variant="subtle"
        color="dark"
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
      >
        <IconDotsVertical />
      </ActionIcon>
      <div onClick={(e) => e.stopPropagation()}>
        <BillModal
          data={{
            name: bill.name,
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
      </div>
    </>
  );
};

export default EditBill;
