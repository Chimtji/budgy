import { IconInfoCircle } from '@tabler/icons-react';
import {
  Flex,
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

const BillCardOverview = ({ value, description, icon, condensed, secondaryValue }: any) => {
  const IconComp = icon;

  return (
    <Paper bg="dark.7" px="md" bd="solid 1px dark.7" mod={{ condensed }} className={styles.wrapper}>
      <Stack gap={0}>
        <Group>
          <ThemeIcon variant="light" classNames={{ root: styles.iconRoot }} mod={{ condensed }}>
            <IconComp size={40} stroke={1.2} color={`var(--mantine-primary-color-light-color)`} />
          </ThemeIcon>
          <Stack gap={0}>
            <Tooltip label="Den månedlige faste overførsel til budgetkonto. Parantes er den første gang overførselen laves, da der er behov for en buffer.">
              <Flex direction="row" align="center" gap="sm">
                <Title order={3} mod={{ condensed }} className={styles.title}>
                  <NumberFormatter
                    value={value}
                    suffix=" Kr."
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Title>
                {secondaryValue && (
                  <Title order={3} mod={{ condensed }} className={styles.title} c="dimmed">
                    <NumberFormatter
                      value={secondaryValue}
                      prefix="("
                      suffix=") Kr."
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                  </Title>
                )}
              </Flex>
            </Tooltip>
            <Text c="dimmed" size={'md'} mod={{ condensed }} className={styles.description}>
              {description}
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
};

export default BillCardOverview;
