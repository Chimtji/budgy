import {
  IconArrowUp,
  IconHeart,
  IconMoneybagPlus,
  IconPigMoney,
  IconReceipt,
} from '@tabler/icons-react';
import {
  Badge,
  Box,
  Center,
  Grid,
  GridCol,
  Group,
  Paper,
  rem,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import classes from './AreasSummary.module.css';

const AreasSummary = () => {
  const icons = {
    income: IconMoneybagPlus,
    expenses: IconReceipt,
    savings: IconPigMoney,
    charity: IconHeart,
  };

  const data = [
    { title: 'Indtægter', icon: 'income', value: '13,456', diff: 34, color: 'green' },
    { title: 'Udgifter', icon: 'expenses', value: '4,145', diff: -13, color: 'red' },
    { title: 'Opsparinger', icon: 'savings', value: '745', diff: 18, color: 'blue' },
    { title: 'Velgørenhed', icon: 'charity', value: '188', diff: -30, color: 'yellow' },
  ] as const;

  return (
    <>
      {data.map((stat) => {
        const Icon = icons[stat.icon];

        return (
          <Paper
            px="lg"
            py="md"
            radius="md"
            key={stat.title}
            bg="dark.8"
            bd={`1px solid var(--mantine-color-gray-8)`}
          >
            <Group justify="space-between" h="100%">
              <Stack gap="xs">
                <Group>
                  <ThemeIcon variant="light" size={60}>
                    <Icon
                      // className={classes.icon}
                      size={40}
                      stroke={1.2}
                      color={`var(--mantine-primary-color-light-color)`}
                    />
                  </ThemeIcon>
                  <Stack gap={5}>
                    <Text size="xs" className={classes.title}>
                      {stat.title}
                    </Text>
                    <Text className={classes.value}>{stat.value} Kr.</Text>
                  </Stack>
                </Group>
              </Stack>
            </Group>
          </Paper>
        );
      })}
    </>
  );
};

export default AreasSummary;
