import { useState } from 'react';
import { IconRotate } from '@tabler/icons-react';
import { Box } from '@mantine/core';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import classes from '../Navbar/Navbar.module.css';

const ForceGetButton = () => {
  const initTransactions = useTransactionsStore((state) => state.initTransactions);

  const handleSync = async () => {
    initTransactions();
  };

  return (
    <>
      <Box
        className={`${classes.link} ${classes.syncButton}`}
        onClick={handleSync}
        style={{ cursor: 'pointer' }}
      >
        <IconRotate className={classes.linkIcon} stroke={1.5} />
        <Box visibleFrom="xl">Hent Uden Cache</Box>
      </Box>
    </>
  );
};

export default ForceGetButton;
