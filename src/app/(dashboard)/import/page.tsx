'use client';

import { useState } from 'react';
import { IconArrowLeft, IconLayoutList, IconLayoutRows } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { categorize } from '@/service/categorization/engine';
import { parseCSV } from '@/service/csv/parser';
import { getAllRules } from '@/service/database/rules/getAll';
import { getTransactionFingerprints } from '@/service/database/transactions/getFingerprints';
import { importBatch } from '@/service/database/transactions/importBatch';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import CSVDropzone from './_components/CSVDropzone';
import ImportPreviewTable from './_components/ImportPreviewTable';

export type TParsedRow = {
  date: string;
  amount: number;
  description: string;
  recipient: string;
  category_key: string;
  segment_key: string;
  company_id: string | null;
  balance: number | null;
  supp_text: string | null;
  duplicate: boolean;
  auto_matched: boolean;
};

type TStep = 'upload' | 'processing' | 'preview';

const CONTENT_PADDING = 'var(--mantine-spacing-xl)';

const ImportPage: React.FC = () => {
  const { categories, segments } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );
  const { companies } = useCompaniesStore(useShallow((s) => ({ companies: s.companies })));

  const [step, setStep] = useState<TStep>('upload');
  const [rows, setRows] = useState<TParsedRow[]>([]);
  const [rules, setRules] = useState<
    {
      pattern: string;
      category_key: string;
      segment_key: string;
      match_count: number;
      company_id: string | null;
    }[]
  >([]);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [activeView, setActiveView] = useState<'unmatched' | 'matched' | 'duplicate'>('unmatched');
  const [grouped, setGrouped] = useState(true);

  const handleFile = async (content: string) => {
    setStep('processing');
    setProgress(0);

    const parsed = parseCSV(content);
    setTotalCount(parsed.length);
    setProgress(10);

    const rulesResult = await getAllRules();
    const rules = rulesResult.success ? rulesResult.data : [];
    setRules(rules);
    setProgress(20);

    const mapped: TParsedRow[] = [];
    const batchSize = Math.max(1, Math.ceil(parsed.length / 40));

    for (let i = 0; i < parsed.length; i += batchSize) {
      const batch = parsed.slice(i, Math.min(i + batchSize, parsed.length));

      for (const r of batch) {
        const { category_key, segment_key, company_id } = categorize(
          r.description,
          r.recipient,
          rules
        );

        // For transactions not matched by rules, try to find a company by tags
        let resolved_company_id = company_id;
        let resolved_category_key = category_key;
        let resolved_segment_key = segment_key;
        if (!resolved_company_id) {
          const haystack = `${r.description} ${r.recipient}`.toLowerCase();
          const matched = companies.find(
            (c) => c.tags.length > 0 && c.tags.some((tag) => haystack.includes(tag.toLowerCase()))
          );
          if (matched) {
            resolved_company_id = matched.id;
            // Use company's default category/segment if the rule didn't assign one
            if (resolved_category_key === 'uncategorized' && matched.category_key) {
              resolved_category_key = matched.category_key;
              resolved_segment_key = matched.segment_key ?? 'uncategorized';
            }
          }
        }

        const auto_matched = resolved_category_key !== 'uncategorized';
        mapped.push({
          ...r,
          category_key: resolved_category_key,
          segment_key: resolved_segment_key,
          company_id: resolved_company_id,
          duplicate: false,
          auto_matched,
        });
      }

      const done = Math.min(i + batchSize, parsed.length);
      setProcessedCount(done);
      setProgress(20 + Math.round((done / parsed.length) * 70));

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    setProgress(90);

    const fingerprintsResult = await getTransactionFingerprints();
    if (fingerprintsResult.success) {
      const existing = new Set(
        fingerprintsResult.data.map((f) => `${f.date}|${f.amount}|${f.description}`)
      );
      for (const row of mapped) {
        row.duplicate = existing.has(`${row.date}|${row.amount}|${row.description}`);
      }
    }

    setProgress(100);
    setRows(mapped);
    setStep('preview');
  };

  const handleImport = async () => {
    const toImport = rows.filter((r) => !r.duplicate);
    setIsImporting(true);
    const result = await importBatch({ transactions: toImport });
    setIsImporting(false);
    if (!result.success) {
      showErrorNotification({ title: 'Fejl', message: 'Import mislykkedes. Prøv igen.' });
      return;
    }
    showSuccessNotification({
      title: 'Importeret',
      message: `${toImport.length} transaktioner blev importeret.`,
    });
    setStep('upload');
    setRows([]);
  };

  const handleImportRow = async (index: number) => {
    const row = rows[index];
    if (row.duplicate) return;
    const result = await importBatch({ transactions: [row] });
    if (!result.success) {
      showErrorNotification({ title: 'Fejl', message: 'Import mislykkedes. Prøv igen.' });
      return;
    }
    showSuccessNotification({ title: 'Importeret', message: '1 transaktion importeret.' });
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportRows = async (indices: number[]) => {
    const toImport = indices.map((i) => rows[i]).filter((r) => !r.duplicate);
    if (toImport.length === 0) return;
    const result = await importBatch({ transactions: toImport });
    if (!result.success) {
      showErrorNotification({ title: 'Fejl', message: 'Import mislykkedes. Prøv igen.' });
      return;
    }
    const indexSet = new Set(indices);
    showSuccessNotification({
      title: 'Importeret',
      message: `${toImport.length} transaktioner importeret.`,
    });
    setRows((prev) => prev.filter((_, i) => !indexSet.has(i)));
  };

  const handleBack = () => {
    setStep('upload');
    setRows([]);
    setRules([]);
    setProgress(0);
    setProcessedCount(0);
  };

  if (step === 'upload') {
    return (
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
            Importer CSV
          </Title>
          <Text size="sm" c="dimmed">
            Upload din bankeksport og gennemse transaktionerne før import
          </Text>
        </Stack>
        <CSVDropzone onFile={handleFile} />
      </Stack>
    );
  }

  if (step === 'processing') {
    return (
      <Stack
        gap="lg"
        align="center"
        justify="center"
        style={{ height: `calc(100vh - ${CONTENT_PADDING} * 2)` }}
      >
        <Stack gap="xs" w={400}>
          <Text fw={600} size="sm">
            Analyserer transaktioner...
          </Text>
          <Progress value={progress} animated size="md" radius="md" />
          <Text size="xs" c="dimmed">
            {progress <= 10
              ? 'Analyserer CSV-fil...'
              : progress <= 20
                ? 'Henter kategoriseringsregler...'
                : progress <= 90
                  ? `${processedCount} af ${totalCount} behandlet`
                  : 'Kontrollerer dubletter...'}
          </Text>
        </Stack>
      </Stack>
    );
  }

  const unmatchedRows = rows.filter((r) => !r.duplicate && r.category_key === 'uncategorized');
  const matchedRows = rows.filter((r) => !r.duplicate && r.category_key !== 'uncategorized');
  const duplicateRows = rows.filter((r) => r.duplicate);
  const importableCount = rows.filter((r) => !r.duplicate).length;

  const handleImportAllMatched = async () => {
    const indices = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.duplicate && r.category_key !== 'uncategorized')
      .map(({ i }) => i);
    setIsImporting(true);
    await handleImportRows(indices);
    setIsImporting(false);
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: `calc(100vh - ${CONTENT_PADDING} * 2)`,
      }}
    >
      <Group justify="space-between" align="center" pb="md" style={{ flexShrink: 0 }}>
        <Group gap="sm">
          <ActionIcon variant="subtle" color="gray" onClick={handleBack}>
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Title order={4} fw={700}>
            Gennemse import
          </Title>
        </Group>
        <Group gap="sm">
          <Button.Group>
            <Button
              variant={activeView === 'unmatched' ? 'light' : 'subtle'}
              color="yellow"
              size="sm"
              onClick={() => setActiveView('unmatched')}
            >
              Opmærksomhed · {unmatchedRows.length}
            </Button>
            <Button
              variant={activeView === 'matched' ? 'light' : 'subtle'}
              color="teal"
              size="sm"
              onClick={() => setActiveView('matched')}
            >
              Klar · {matchedRows.length}
            </Button>
            {duplicateRows.length > 0 && (
              <Button
                variant={activeView === 'duplicate' ? 'light' : 'subtle'}
                color="gray"
                size="sm"
                onClick={() => setActiveView('duplicate')}
              >
                Duplikater · {duplicateRows.length}
              </Button>
            )}
          </Button.Group>
          {matchedRows.length > 0 && (
            <Button
              variant="light"
              color="teal"
              onClick={handleImportAllMatched}
              loading={isImporting}
            >
              Importer alle klar · {matchedRows.length}
            </Button>
          )}
          <Button onClick={handleImport} loading={isImporting} disabled={importableCount === 0}>
            Importer {importableCount}
          </Button>
          <Tooltip label={grouped ? 'Vis uden gruppering' : 'Vis med gruppering'} withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={() => setGrouped((v) => !v)}
            >
              {grouped ? <IconLayoutList size={16} /> : <IconLayoutRows size={16} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Paper
        p={0}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ImportPreviewTable
          rows={rows}
          activeView={activeView}
          grouped={grouped}
          categories={categories}
          segments={segments}
          companies={companies}
          rules={rules}
          onChange={setRows}
          onImportRow={handleImportRow}
          onImportRows={handleImportRows}
        />
      </Paper>
    </Box>
  );
};

export default ImportPage;
