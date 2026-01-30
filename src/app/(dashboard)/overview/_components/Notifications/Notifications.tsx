import { IconInfoCircle } from '@tabler/icons-react';
import { ActionIcon, Alert, Flex, Paper, Stack, Title, Tooltip } from '@mantine/core';

const Notifications = () => {
  return (
    <Paper p="sm" pt="xs" radius="md" w="100%">
      <Stack>
        <Flex justify="space-between">
          <Title order={3}>Meddelelser</Title>
          <Tooltip label="wadadawad" withArrow>
            <ActionIcon variant="transparent" c="dimmed" size="sm">
              <IconInfoCircle />
            </ActionIcon>
          </Tooltip>
        </Flex>
        <Stack gap="xs">
          <Alert variant="light" icon={<IconInfoCircle />} color="yellow">
            Transaktioner mangler at blive kategoriseret
          </Alert>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default Notifications;
