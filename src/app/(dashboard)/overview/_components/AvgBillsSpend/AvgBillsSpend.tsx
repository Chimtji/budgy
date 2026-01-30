import {
  IconFiles,
  IconInfoCircle,
  IconReceipt,
  IconReceipt2,
  IconReceiptFilled,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';

const AvgBillsSpend = () => {
  const data = [
    { description: 'Gennemsnit pr. måned', value: '1.234 Kr.', icon: IconReceipt2 },
    { description: 'Antal i alt', value: 32, icon: IconFiles },
  ];
  return (
    <Paper p="sm" pt="xs" radius="md" w="100%">
      <Stack>
        <Flex justify="space-between">
          <Title order={3}>Faste Regninger</Title>
          <Tooltip label="wadadawad" withArrow>
            <ActionIcon variant="transparent" c="dimmed" size="sm">
              <IconInfoCircle />
            </ActionIcon>
          </Tooltip>
        </Flex>
        <Stack gap="xs">
          {data.map((item) => (
            <Group key={item.description + item.value}>
              <ThemeIcon variant="light" size="xl">
                <item.icon />
              </ThemeIcon>
              <Stack gap={0}>
                <Text c="dimmed" fz="sm">
                  {item.description}:
                </Text>
                <Title order={2}>{item.value}</Title>
              </Stack>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default AvgBillsSpend;
