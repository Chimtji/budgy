'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { Box, Paper, Stack } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useAppStore } from '@/stores/app/appStore';
import { useBillsStore } from '@/stores/bills/billsStore';
import BillsOverview from './_components/BillsOverview';
import BillsTable from './_components/BillsTable/BillsTable';
import CalendarView from './_components/CalendarView';
import ControlBar from './_components/ControlBar';
import classes from './page.module.css';

const Bills = () => {
  const year = useAppStore((state) => state.year);
  const { bills, getAllOfYear } = useBillsStore(
    useShallow((state) => ({
      bills: state.bills,
      getAllOfYear: state.getAllOfYear,
    }))
  );

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    getAllOfYear(year);
  }, []);

  return (
    <Stack gap="lg" className={classes.page}>
      <Box className={classes.head}>
        <ControlBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          search={search}
          onSearchChange={setSearch}
        />
      </Box>

      {viewMode === 'list' && (
        <Paper className={classes.table} radius="md" p="sm">
          <BillsTable title="Regninger" bills={bills[year] || {}} search={debouncedSearch} />
        </Paper>
      )}

      {viewMode === 'calendar' && (
        <Box className={classes.calendar}>
          <CalendarView bills={bills[year] || {}} year={year} />
        </Box>
      )}

      <Box className={classes.overview}>
        <BillsOverview year={year} />
      </Box>
    </Stack>
  );
};

export default Bills;
