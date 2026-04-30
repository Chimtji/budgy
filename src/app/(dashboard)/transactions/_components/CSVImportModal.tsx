'use client';

import { useState } from 'react';
import { IconUpload, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { Alert, Badge, Button, Card, Group, Progress, Stack, Table, Text, Loader } from '@mantine/core';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { ParsedTransaction } from '@/service/csv/parser';
import { parseCSVFile } from '@/service/csv/reader';
import { importTransactionsFromCSV } from '@/service/database/transactions/importCSV';

export default function CSVImportModal() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload');
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setStatusMessage('Læser CSV-fil...');
    setParseError('');

    try {
      setStatusMessage(`Parser ${file.name}...`);
      const transactions = await parseCSVFile(file);

      if (transactions.length === 0) {
        const errorMsg = `Kunne ikke finde nogen transaktioner i ${file.name}. Tjek at CSV-filen har de rigtige kolonne-navne (Dato, Beløb, Tekst/Modtager, etc.)`;
        setParseError(errorMsg);
        showErrorNotification({
          title: 'Parsing fejlede',
          message: errorMsg,
        });
        setStatusMessage('');
        setIsLoading(false);
        return;
      }

      setStatusMessage(`${transactions.length} transaktioner fundet og parsed!`);
      setPreviewTransactions(transactions);
      setStep('preview');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ukendt fejl ved parsing af CSV';
      setParseError(errorMsg);
      showErrorNotification({
        title: 'CSV Parsing fejlede',
        message: errorMsg,
      });
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setIsLoading(true);
    setStatusMessage('Starter import til database...');

    try {
      const result = await importTransactionsFromCSV(previewTransactions);

      if (result.success && result.data) {
        setImportResult(result.data);
        setStep('success');
        setStatusMessage(
          `✓ Import fuldført! ${result.data.imported} transaktioner importeret, ${result.data.duplicates} dubletter, ${result.data.errors} fejl`
        );
        showSuccessNotification({
          title: 'Import fuldført',
          message: `${result.data.imported} transaktioner er nu gemt i databasen`,
        });
      } else if (!result.success) {
        const errorMsg = (result as any).error || 'Ukendt fejl';
        setStatusMessage('Import fejlede!');
        showErrorNotification({
          title: 'Import fejlede',
          message: errorMsg,
        });
        setStep('preview');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ukendt fejl';
      setStatusMessage('Import fejlede!');
      showErrorNotification({
        title: 'Import fejlede',
        message: errorMsg,
      });
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setPreviewTransactions([]);
    setFileName('');
    setImportResult(null);
    setStatusMessage('');
    setParseError('');
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

          {parseError && (
            <Alert icon={<IconAlertCircle />} color="red">
              <Stack gap="xs">
                <Text fw={600}>Parsing fejlede</Text>
                <Text size="sm">{parseError}</Text>
              </Stack>
            </Alert>
          )}

          {statusMessage && (
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm">{statusMessage}</Text>
            </Group>
          )}

          <div
            style={{
              border: '2px dashed #868e96',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
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
            <label htmlFor="csv-upload" style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              <Stack gap="xs" align="center">
                {isLoading ? <Loader size={32} /> : <IconUpload size={32} />}
                <div>
                  <Text fw={500}>{isLoading ? 'Parser CSV-fil...' : 'Klik for at vælge fil eller træk CSV-fil hen'}</Text>
                  <Text size="sm" c="dimmed">
                    Understøtter: Danske Bank, Nordea, Revolut, Wise og generiske CSV-filer
                  </Text>
                </div>
              </Stack>
            </label>
          </div>

          <Text size="xs" c="dimmed">
            Kun CSV-filer er understøttet. Transaktioner bliver automatisk kategoriseret.
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
              {fileName} - {previewTransactions.length} transaktioner fundet og klar til import
            </Text>
          </div>

          <Alert color="blue" title="Hvad sker der ved import?">
            <Stack gap="xs">
              <Text size="sm">✓ {previewTransactions.length} transaktioner gemmes i databasen</Text>
              <Text size="sm">✓ Dubletter detekteres og springes over</Text>
              <Text size="sm">✓ Automatisk kategorisering bliver anvendt</Text>
              <Text size="sm">✓ Du kan redigere alt efterfølgende</Text>
            </Stack>
          </Alert>

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
              + {previewTransactions.length - 10} flere transaktioner (vises ikke i forhåndsvisning)
            </Text>
          )}

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={handleReset} disabled={isLoading}>
              Annuller
            </Button>
            <Button onClick={handleImport} loading={isLoading}>
              {isLoading ? 'Importerer...' : `Importér alle ${previewTransactions.length}`}
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  }

  if (step === 'importing') {
    return (
      <Card withBorder p="lg">
        <Stack gap="md" align="center">
          <div style={{ textAlign: 'center' }}>
            <Text fw={700} size="lg">
              Importerer transaktioner...
            </Text>
            <Text size="sm" c="dimmed">
              Vent venligst mens dine {previewTransactions.length} transaktioner gemmes til databasen
            </Text>
          </div>

          <Loader size="lg" />

          <div style={{ width: '100%' }}>
            <Progress value={50} animated />
          </div>

          <Text size="sm" c="dimmed" style={{ textAlign: 'center' }}>
            {statusMessage || 'Behandler transaktioner...'}
          </Text>
        </Stack>
      </Card>
    );
  }

  if (step === 'success' && importResult) {
    return (
      <Card withBorder p="lg">
        <Stack gap="md">
          <div style={{ textAlign: 'center' }}>
            <Group justify="center" mb="md">
              <IconCheck size={32} color="green" />
            </Group>
            <Text fw={700} size="lg" c="green">
              Import fuldført!
            </Text>
            <Text size="sm" c="dimmed">
              Dine transaktioner er nu gemt i databasen
            </Text>
          </div>

          <Alert icon={<IconCheck />} color="green">
            <Stack gap="xs">
              <Text fw={600}>Status</Text>
              <div>
                <Text size="sm">✓ {importResult.imported} transaktioner importeret</Text>
                {importResult.duplicates > 0 && <Text size="sm">⊘ {importResult.duplicates} dubletter (allerede importeret)</Text>}
                {importResult.errors > 0 && <Text size="sm">✕ {importResult.errors} transaktioner med fejl</Text>}
              </div>
            </Stack>
          </Alert>

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

          <Text size="xs" c="dimmed">
            Dine transaktioner vil nu vises på transaktionslisten og være kategoriseret automatisk. Du kan redigere kategorier og segmenter direkte i transaktionslisten.
          </Text>

          <Button onClick={handleReset} fullWidth>
            Importér mere
          </Button>
        </Stack>
      </Card>
    );
  }

  return null;
}
