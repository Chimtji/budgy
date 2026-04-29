'use client';

import { useState } from 'react';
import { Button, Card, Group, Stack, Text, Progress, Badge, Table } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { parseCSVFile } from '@/service/csv/reader';
import { importTransactionsFromCSV } from '@/service/database/transactions/importCSV';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { ParsedTransaction } from '@/service/csv/parser';

export default function CSVImportModal() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    try {
      const transactions = await parseCSVFile(file);

      if (transactions.length === 0) {
        showErrorNotification({
          title: 'Parsing fejlede',
          message: 'Ingen transaktioner fundet i CSV-filen',
        });
        setIsLoading(false);
        return;
      }

      setPreviewTransactions(transactions);
      setStep('preview');
    } catch (error) {
      showErrorNotification({
        title: 'CSV Parsing fejlede',
        message: error instanceof Error ? error.message : 'Ukendt fejl',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setIsLoading(true);

    try {
      const result = await importTransactionsFromCSV(previewTransactions);

      if (result.success && result.data) {
        setImportResult(result.data);
        showSuccessNotification({
          title: 'Import fuldført',
          message: `${result.data.imported} transaktioner importeret`,
        });
      } else if (!result.success) {
        showErrorNotification({
          title: 'Import fejlede',
          message: (result as any).error || 'Ukendt fejl',
        });
      }
    } catch (error) {
      showErrorNotification({
        title: 'Import fejlede',
        message: error instanceof Error ? error.message : 'Ukendt fejl',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setPreviewTransactions([]);
    setFileName('');
    setImportResult(null);
  };

  if (step === 'upload') {
    return (
      <Card withBorder p="lg">
        <Stack gap="md">
          <div>
            <Text fw={700} size="lg">
              Importer bankudtog
            </Text>
            <Text size="sm" c="dimmed">
              Upload en CSV-fil fra din bank for at importere transaktioner
            </Text>
          </div>

          <div
            style={{
              border: '2px dashed #868e96',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isLoading}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload" style={{ cursor: 'pointer' }}>
              <Stack gap="xs" align="center">
                <IconUpload size={32} />
                <div>
                  <Text fw={500}>Klik for at vælge fil eller træk CSV-fil hen</Text>
                  <Text size="sm" c="dimmed">
                    Understøtter: Danske Bank, Nordea, Revolut, Wise og generiske CSV-filer
                  </Text>
                </div>
              </Stack>
            </label>
          </div>

          <Text size="xs" c="dimmed">
            Kun CSV-filer er understøttet. Transaktioner vil blive automatisk kategoriseret.
          </Text>
        </Stack>
      </Card>
    );
  }

  if (step === 'preview' && previewTransactions.length > 0) {
    return (
      <Card withBorder p="lg">
        <Stack gap="md">
          <div>
            <Text fw={700} size="lg">
              Forhåndsvisning
            </Text>
            <Text size="sm" c="dimmed">
              {fileName} - {previewTransactions.length} transaktioner fundet
            </Text>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Dato</Table.Th>
                  <Table.Th>Handlende</Table.Th>
                  <Table.Th>Beløb</Table.Th>
                  <Table.Th>Beskrivelse</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {previewTransactions.slice(0, 10).map((tx, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>{tx.transactionDate}</Table.Td>
                    <Table.Td>{tx.merchantName}</Table.Td>
                    <Table.Td>{tx.amount.toFixed(2)} DKK</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {tx.description || '-'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          {previewTransactions.length > 10 && (
            <Text size="sm" c="dimmed">
              + {previewTransactions.length - 10} flere transaktioner
            </Text>
          )}

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={handleReset} disabled={isLoading}>
              Annuller
            </Button>
            <Button onClick={handleImport} loading={isLoading}>
              Importer {previewTransactions.length}
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  }

  if (step === 'importing' && importResult) {
    return (
      <Card withBorder p="lg">
        <Stack gap="md">
          <div>
            <Text fw={700} size="lg">
              Import fuldført
            </Text>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <Text fw={700} size="lg" c="green">
                {importResult.imported}
              </Text>
              <Text size="sm" c="dimmed">
                Importeret
              </Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text fw={700} size="lg" c="yellow">
                {importResult.duplicates}
              </Text>
              <Text size="sm" c="dimmed">
                Dubletter
              </Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text fw={700} size="lg" c="red">
                {importResult.errors}
              </Text>
              <Text size="sm" c="dimmed">
                Fejl
              </Text>
            </div>
          </div>

          <Button onClick={handleReset} fullWidth>
            Importer mere
          </Button>
        </Stack>
      </Card>
    );
  }

  return null;
}
