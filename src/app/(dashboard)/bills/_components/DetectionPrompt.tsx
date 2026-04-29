'use client';

import { Badge, Button, Card, Group, Progress, Stack, Text } from '@mantine/core';
import { DetectedSubscription } from '@/service/database/subscriptions/detect';
import RecurrenceIndicator from './RecurrenceIndicator';

interface DetectionPromptProps {
  detected: DetectedSubscription[];
  onConfirm: (merchantName: string, categoryId: string, segmentId: string) => void;
  onEdit: (detected: DetectedSubscription) => void;
  onIgnore: (merchantName: string) => void;
  selectedCategorySegment?: Record<string, { categoryId: string; segmentId: string }>;
}

export default function DetectionPrompt({
  detected,
  onConfirm,
  onEdit,
  onIgnore,
  selectedCategorySegment,
}: DetectionPromptProps) {
  if (detected.length === 0) return null;

  return (
    <Stack gap="lg">
      <div>
        <Text fw={500} mb="sm">
          Detekterede mulige abonnementer ({detected.length})
        </Text>
        <Text size="sm" c="dimmed">
          Vi har fundet nogle transaktioner, der ser ud til at være tilbagevendende. Bekræft eller
          rediger dem herunder.
        </Text>
      </div>

      {detected.map((item) => {
        const selected = selectedCategorySegment?.[item.merchantName];

        return (
          <Card key={item.merchantName} withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>{item.merchantName}</Text>
                  <Text size="sm" c="dimmed">
                    {item.transactionCount} transaktioner siden{' '}
                    {new Date(item.lastTransactionDate).toLocaleDateString('da-DK')}
                  </Text>
                </div>
                <Badge size="lg" variant="outline">
                  {Math.round(item.confidence)}% sikker
                </Badge>
              </Group>

              <Progress value={item.confidence} size="sm" />

              <Group justify="space-between">
                <div>
                  <RecurrenceIndicator cadence={item.cadence} />
                  <Text size="sm" ml="xs">
                    {item.expectedAmount.toFixed(2)} EUR
                  </Text>
                </div>
                <Text size="sm" c="dimmed">
                  Næste: {new Date(item.nextDueDate || '').toLocaleDateString('da-DK')}
                </Text>
              </Group>

              {selected && (
                <Text size="sm" c="teal">
                  ✓ Kategori og segment valgt
                </Text>
              )}

              <Group justify="flex-end">
                <Button variant="subtle" onClick={() => onIgnore(item.merchantName)}>
                  Ignorer
                </Button>
                <Button variant="subtle" onClick={() => onEdit(item)} disabled={!selected}>
                  Rediger
                </Button>
                <Button
                  disabled={!selected}
                  onClick={() => {
                    if (selected) {
                      onConfirm(item.merchantName, selected.categoryId, selected.segmentId);
                    }
                  }}
                >
                  Bekræft
                </Button>
              </Group>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
