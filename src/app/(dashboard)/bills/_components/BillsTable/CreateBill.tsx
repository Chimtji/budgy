import { useShallow } from 'zustand/shallow';
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAppStore } from '@/stores/app/appStore';
import { useBillsStore } from '@/stores/bills/billsStore';
import BillModal, { TBillModalProps } from './BillModal';

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
    name,
  }) => {
    addBill({
      amount: Number(amount),
      category,
      segment,
      due,
      companyId: company.id,
      companyName: company.name,
      companyDomain: company.domain,
      year,
      name,
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
