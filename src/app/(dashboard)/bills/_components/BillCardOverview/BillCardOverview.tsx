import { Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import styles from './BillCardOverview.module.css';

const BillCardOverview = ({ value, description, icon, condensed }: any) => {
  const IconComp = icon;

  return (
    <Paper bg="dark.7" px="md" bd="solid 1px dark.7" mod={{ condensed }} className={styles.wrapper}>
      <Stack gap={0}>
        <Group>
          <ThemeIcon variant="light" classNames={{ root: styles.iconRoot }} mod={{ condensed }}>
            <IconComp size={40} stroke={1.2} color={`var(--mantine-primary-color-light-color)`} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={3} mod={{ condensed }} className={styles.title}>
              {value} kr.
            </Title>
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
