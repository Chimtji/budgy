import {
  IconArrowDown,
  IconArrowUp,
  IconArrowUpRight,
  IconDeviceAnalytics,
  IconInfoCircle,
} from '@tabler/icons-react';
import { DonutChart } from '@mantine/charts';
import {
  ActionIcon,
  Badge,
  Box,
  Flex,
  Group,
  Paper,
  Progress,
  ProgressLabel,
  ProgressRoot,
  ProgressSection,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import styles from './FundsAllocation.module.css';

const FundsAllocation = () => {
  const data = [
    { name: 'Forbrug', value: 90, color: 'teal', goal: 80 },
    { name: 'Opsparinger', value: 5, color: 'black', goal: 10 },
    { name: 'Velgørenhed', value: 5, color: 'cyan', goal: 10 },
  ];

  const descriptions = data.map((stat) => (
    <Box key={stat.name} style={{ borderBottomColor: stat.color }} w="100%">
      <Text tt="uppercase" fz={10} fw={700}>
        {stat.name}
      </Text>

      <Flex w="100%" gap={rem('4px')}>
        <Text c={stat.color === 'black' ? 'white' : stat.color} fw={700} size="sm">
          {stat.value}%
        </Text>
        <Group gap={rem('3px')}>
          {stat.value - stat.goal < 0 ? <IconArrowDown size={12} /> : <IconArrowUp size={12} />}
          <Text size="xs">{Math.abs(stat.value - stat.goal)}%</Text>
        </Group>
      </Flex>
    </Box>
  ));

  return (
    <Paper p="sm" pt="xs" radius="md" w="100%">
      <Stack>
        <Flex justify="space-between">
          <Title order={3}>Disponering</Title>
          <Tooltip label="wadadawad" withArrow>
            <ActionIcon variant="transparent" c="dimmed" size="sm">
              <IconInfoCircle />
            </ActionIcon>
          </Tooltip>
        </Flex>
        <Group>
          <ProgressRoot size={34} w="100%" bg="dark.8" className={styles.progress}>
            {data.map((part) => (
              <ProgressSection value={part.value} color={part.color} key={part.name}>
                {/* {part.value > 10 && <ProgressLabel>{part.name}</ProgressLabel>} */}
              </ProgressSection>
            ))}
          </ProgressRoot>
          <SimpleGrid cols={3} spacing="xs" w="100%">
            {descriptions}
          </SimpleGrid>
        </Group>
      </Stack>
    </Paper>
  );
};

export default FundsAllocation;
