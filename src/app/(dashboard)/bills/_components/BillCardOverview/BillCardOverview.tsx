import { IconInfoCircle } from '@tabler/icons-react';
import {
  Group,
  NumberFormatter,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import styles from './BillCardOverview.module.css';

const BillCardOverview = ({ value, description, icon, secondaryValue }: any) => {
  const IconComp = icon;

  const tooltipLabel = secondaryValue
    ? `Første betaling: ${new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 0 }).format(secondaryValue)}`
    : null;

  return (
    <Paper
      bg="dark.7"
      px="md"
      py="lg"
      bd="solid 1px dark.7"
      className={styles.wrapper}
      style={{ transition: 'all 0.2s ease' }}
    >
      <Stack gap={0}>
        <Group gap="md">
          <ThemeIcon variant="light" className={styles.iconRoot}>
            <IconComp size={40} stroke={1.2} color={`var(--mantine-primary-color-light-color)`} />
          </ThemeIcon>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text c="dimmed" size={'xs'} className={styles.description}>
              {description}
            </Text>
            <Tooltip label={tooltipLabel} disabled={!tooltipLabel}>
              <Title order={3} className={styles.title}>
                <NumberFormatter
                  value={value}
                  suffix=" Kr."
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Title>
            </Tooltip>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
};

export default BillCardOverview;
