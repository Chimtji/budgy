'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Container, Loader, Text, Title } from '@mantine/core';
import requisition from '@/data/requisition.json';

export default function ConsentCallbackPage() {
  const params = useSearchParams();
  const requisitionId = params.get('ref');

  const [accounts, setAccounts] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requisition) return;

    const load = async () => {
      const response = await fetch(`/api/accounts?requisition_id=${requisition.id}`);
      const accountsData = await response.json();
      console.log('accountsData:', accountsData);
      setAccounts(accountsData.accounts);

      if (accounts.length > 0) {
        const txRes = await fetch(`/api/transactions?account_id=${accounts[2]}`);
        const txData = await txRes.json();
        console.log(txData);
        setTransactions(txData.transactions.booked || []);
      }

      setLoading(false);
    };

    load();
  }, [requisitionId]);

  return (
    <Container pt="xl">
      <Title order={2} mb="md">
        Your Transactions
      </Title>

      {loading ? (
        <Loader />
      ) : (
        <>
          {transactions.length === 0 ? (
            <Text>No transactions found.</Text>
          ) : (
            transactions.map((tx: any, i: number) => (
              <Card key={i} withBorder shadow="sm" mb="sm">
                <Text>
                  <strong>{tx.remittanceInformation || 'Unknown'}</strong>
                </Text>
                <Text size="sm" color="dimmed">
                  {tx.bookingDate}
                </Text>
                <Text color={parseFloat(tx.transactionAmount.amount) < 0 ? 'red' : 'green'}>
                  {tx.transactionAmount.amount} {tx.transactionAmount.currency}
                </Text>
              </Card>
            ))
          )}
        </>
      )}
    </Container>
  );
}
