import {
  IconBeach,
  IconFiles,
  IconHome,
  IconInfoCircle,
  IconLifebuoy,
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

const KeyFigures = () => {
  const data = [
    { description: 'Rådighedsbeløb', value: '1.234 Kr.', icon: IconBeach },
    { description: 'Boligudgifter pr. måned', value: '1.234 Kr.', icon: IconHome },
    { description: 'Forsikringer pr. måned', value: '1.234 Kr.', icon: IconLifebuoy },
  ];
  return (
    <Paper p="sm" pt="xs" radius="md" w="100%">
      <Stack>
        <Flex justify="space-between">
          <Title order={3}>Nøgletal</Title>
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
                <Text c="dimmed" fz="xs">
                  {item.description}:
                </Text>
                <Title order={4}>{item.value}</Title>
              </Stack>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default KeyFigures;
