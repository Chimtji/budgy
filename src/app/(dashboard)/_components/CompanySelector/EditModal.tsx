import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Drawer,
  Flex,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { TCompanyDraft } from '@/stores/companies/companiesStore';

const EditModal = ({
  search,
  add,
  active,
}: {
  search: string;
  add: ({ name, description, domain }: TCompanyDraft) => Promise<void>;
  active: boolean;
}) => {
  const [opened, { open, close }] = useDisclosure(active);

  useEffect(() => {
    if (active) {
      open();
    }
  }, [active]);

  const [name, setName] = useState<string>(search);
  const [domain, setDomain] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleClose = () => {
    close();
  };

  return (
    <Drawer opened={opened} onClose={handleClose} position="right" zIndex={300}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ paddingBottom: 'var(--mantine-spacing-xl)' }}>
          <Title>Redigér</Title>
        </div>

        <Stack gap="md" style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--mantine-spacing-md)' }}>
          <TextInput
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            label="Forhandler Navn"
            placeholder="Skriv forhandler navn"
          />
          <TextInput
            value={domain}
            onChange={(event) =>
              setDomain(
                event.currentTarget.value
                  .replace('https://', '')
                  .replace('http://', '')
                  .replace(/\/$/, '')
              )
            }
            label="Forhandler Hjemmeside"
            placeholder="Skriv forhandlerens hjemmeside"
          />
          <TextInput
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            label="Beskrivelse (valgfri)"
            placeholder="Skriv Beskrivelse"
          />
          <Flex gap="md" mt="lg">
            <Image
              radius="md"
              src={`https://cdn.brandfetch.io/domain/${domain}?c=${process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID}`}
              w="4em"
              h="4em"
            />
            <Flex direction="column" justify="center">
              <Title order={4}>{name || 'Forhandler navn'}</Title>
              <Text c="dimmed">{description || 'Forhandler Beskrivelse'}</Text>
            </Flex>
          </Flex>
        </Stack>

        <Group justify="flex-end" gap="md" style={{ paddingTop: 'var(--mantine-spacing-md)', marginTop: 'auto' }}>
          <Button variant="subtle" onClick={handleClose}>
            Tilbage
          </Button>
          <Button
            variant="filled"
            onClick={() => {
              add({ name, description, domain }).then(() => {
                handleClose();
              });
            }}
          >
            Tilføj
          </Button>
        </Group>
      </div>
    </Drawer>
  );
};

export default EditModal;

