import { useState } from 'react';
import { IconRefresh } from '@tabler/icons-react';
import { Box, Loader } from '@mantine/core';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { useUserStore } from '@/stores/user/userStore';
import EstablishConnectionModal from './EstablishConnectionOverlay';
import classes from '../Navbar/Navbar.module.css';

const SyncButton = () => {
  const authenticated = useUserStore((state) => state.fullAuthenticated);
  const syncTransactions = useTransactionsStore((state) => state.syncTransactions);
  const [showEstablishConnection, setShowEstablishConnection] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    if (authenticated) {
      await syncTransactions();
      setLoading(false);
    } else {
      setShowEstablishConnection(true);
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        className={`${classes.link} ${classes.syncButton}`}
        onClick={handleSync}
        style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
        data-loading={loading}
      >
        {loading ? (
          <Loader size="sm" color="gray.6" />
        ) : (
          <IconRefresh className={classes.linkIcon} stroke={1.5} />
        )}
        <Box visibleFrom="xl">{loading ? 'Synkroniserer...' : 'Synkronisér'}</Box>
      </Box>
      <EstablishConnectionModal open={showEstablishConnection} />
    </>
  );
};

export default SyncButton;
