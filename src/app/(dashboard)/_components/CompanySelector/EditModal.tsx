import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Center,
  Flex,
  Group,
  Image,
  Modal,
  SimpleGrid,
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
    <Modal opened={opened} onClose={handleClose} centered zIndex={300}>
      <Stack pl="xl" pr="xl" pb="md">
        <Title>Redigér</Title>
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
        <Center mt="lg">
          <Group>
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
        </Center>
      </Stack>
    </Modal>
  );
};

export default EditModal;
