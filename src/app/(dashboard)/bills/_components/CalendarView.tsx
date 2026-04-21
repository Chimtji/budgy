'use client';

import { useState } from 'react';
import { Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import EditBill from './BillsTable/EditBill';
import MonthCalendarGrid from './MonthCalendarGrid';
import MonthDrawer from './MonthDrawer';

type CalendarViewProps = {
  bills: Record<number, any>;
  year: number;
};

const CalendarView = ({ bills, year }: CalendarViewProps) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const handleBillSelected = (bill: any) => {
    setSelectedBill(bill);
    setSelectedMonth(null);
    openEdit();
  };

  return (
    <Stack gap="md">
      <MonthCalendarGrid bills={bills} onViewMore={setSelectedMonth} />
      <MonthDrawer
        opened={selectedMonth !== null}
        monthIndex={selectedMonth}
        onClose={() => setSelectedMonth(null)}
        bills={bills}
        onBillSelected={handleBillSelected}
      />
      {selectedBill && (
        <EditBill
          bill={selectedBill}
          opened={editOpened}
          open={openEdit}
          close={() => {
            closeEdit();
            setSelectedBill(null);
          }}
        />
      )}
    </Stack>
  );
};

export default CalendarView;
