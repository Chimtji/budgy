import { IconInfoCircle } from '@tabler/icons-react';
import {
  ActionIcon,
  Flex,
  Paper,
  rem,
  SimpleGrid,
  Stack,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';

const BudgetScore = () => {
  return (
    <Paper p="sm" pt="xs" radius="md" w="100%">
      <Stack gap={0}>
        <Flex justify="space-between">
          <Title order={3}>Budget Score</Title>
          <Tooltip label="wadadawad" withArrow>
            <ActionIcon variant="transparent" c="dimmed" size="sm">
              <IconInfoCircle />
            </ActionIcon>
          </Tooltip>
        </Flex>
        <Flex align="center" gap="xs" m="auto">
          <Title fw="normal" fz={rem('50px')}>
            78
          </Title>
          <Title c="dimmed" fw={300} fz={rem('56px')}>
            /
          </Title>
          <Title c="dimmed" fw="normal" fz={rem('44px')} mt="md">
            100
          </Title>
        </Flex>
      </Stack>
    </Paper>
  );
};

export default BudgetScore;
