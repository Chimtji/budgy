'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconLayoutList,
  IconList,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import CompanyForm from './_components/CompanyForm';
import CompanyLogo from './_components/CompanyLogo';

type TCompany = {
  id: string;
  name: string;
  domain: string | null;
  tags: string[];
  category_key: string | null;
  segment_key: string | null;
};

const CompaniesPage: React.FC = () => {
  const { companies, addCompany, updateCompany, removeCompany } = useCompaniesStore(
    useShallow((s) => ({
      companies: s.companies,
      addCompany: s.addCompany,
      updateCompany: s.updateCompany,
      removeCompany: s.removeCompany,
    }))
  );
  const { categories, segments } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );

  const [editing, setEditing] = useState<TCompany | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [grouped, setGrouped] = useState(true);
  const scrollContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useCompaniesStore.getState().init();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...companies]
      .filter(
        (c) => !q || c.name.toLowerCase().includes(q) || (c.domain ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  }, [companies, search]);

  const grouped_map = useMemo(() => {
    const map = new Map<string, TCompany[]>();
    for (const c of filtered) {
      const letter = c.name[0]?.toUpperCase() ?? '#';
      const key = /^[A-ZÆØÅ]/.test(letter) ? letter : '#';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [filtered]);

  const letters = useMemo(
    () => [...grouped_map.keys()].sort((a, b) => a.localeCompare(b, 'da')),
    [grouped_map]
  );

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`letter-group-${letter}`);
    if (el && scrollContainer.current) {
      scrollContainer.current.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
    }
  };

  const handleSave = (
    name: string,
    domain: string | null,
    tags: string[],
    category_key: string | null,
    segment_key: string | null
  ) => {
    if (editing) {
      updateCompany(editing.id, name, domain, tags, category_key, segment_key);
    } else {
      addCompany(name, domain, tags, category_key, segment_key);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(undefined);
  };

  const renderRow = (c: TCompany) => {
    const cat = c.category_key ? categories.find((x) => x.key === c.category_key) : undefined;
    const seg =
      c.segment_key && c.category_key
        ? segments.find((x) => x.key === c.segment_key && x.category_key === c.category_key)
        : undefined;
    return (
      <Table.Tr key={c.id} style={{ background: 'var(--mantine-color-default-hover)' }}>
        <Table.Td style={{ borderRadius: '6px 0 0 6px' }}>
          <CompanyLogo domain={c.domain} name={c.name} size={28} />
        </Table.Td>
        <Table.Td>
          <Text size="sm" fw={500}>
            {c.name}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed">
            {c.domain ?? '—'}
          </Text>
        </Table.Td>
        <Table.Td>
          <Group gap={4} wrap="wrap">
            {c.tags.length === 0 ? (
              <Text size="xs" c="dimmed">
                —
              </Text>
            ) : (
              c.tags.map((tag) => (
                <Badge key={tag} variant="light" color="gray" size="xs" radius="sm">
                  {tag}
                </Badge>
              ))
            )}
          </Group>
        </Table.Td>
        <Table.Td>
          <Group gap={4} wrap="nowrap">
            {cat ? (
              <>
                <Badge variant="light" color={cat.color} size="sm" radius="sm">
                  {cat.label}
                </Badge>
                {seg && (
                  <Badge variant="light" color="gray" size="sm" radius="sm">
                    {seg.label}
                  </Badge>
                )}
              </>
            ) : (
              <Text size="xs" c="dimmed">
                —
              </Text>
            )}
          </Group>
        </Table.Td>
        <Table.Td style={{ borderRadius: '0 6px 6px 0', whiteSpace: 'nowrap' }}>
          <Group gap={4} justify="flex-end" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => {
                setEditing(c);
                setShowForm(true);
              }}
            >
              <IconPencil size={14} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeCompany(c.id)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--mantine-spacing-xl) * 2)',
      }}
    >
      <Group justify="space-between" align="flex-end" pb="md" style={{ flexShrink: 0 }}>
        <Stack gap={4}>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
            Virksomheder
          </Title>
          <Text size="sm" c="dimmed">
            {filtered.length} virksomheder
          </Text>
        </Stack>
        <Group gap="sm">
          <TextInput
            placeholder="Søg..."
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="sm"
            w={200}
          />
          <Tooltip label={grouped ? 'Vis som liste' : 'Vis grupperet'} withArrow>
            <ActionIcon
              variant={grouped ? 'light' : 'subtle'}
              color={grouped ? 'violet' : 'gray'}
              size="lg"
              onClick={() => setGrouped((v) => !v)}
            >
              {grouped ? (
                <IconLayoutList size={16} stroke={1.5} />
              ) : (
                <IconList size={16} stroke={1.5} />
              )}
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setShowForm(true)}>
            Ny virksomhed
          </Button>
        </Group>
      </Group>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 8 }}>
        <Paper
          p="sm"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div ref={scrollContainer} style={{ overflow: 'auto', flex: 1 }}>
            <Table style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <Table.Thead
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: 'var(--mantine-color-body)',
                }}
              >
                <Table.Tr>
                  <Table.Th w={44} />
                  <Table.Th>Navn</Table.Th>
                  <Table.Th>Domæne</Table.Th>
                  <Table.Th>Søgeord</Table.Th>
                  <Table.Th>Kategori</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text size="sm" c="dimmed" py="md" ta="center">
                        {search ? 'Ingen resultater.' : 'Ingen virksomheder endnu.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {grouped
                  ? [...grouped_map.entries()]
                      .sort(([a], [b]) => a.localeCompare(b, 'da'))
                      .map(([letter, group]) => (
                        <>
                          <Table.Tr key={`hdr-${letter}`} id={`letter-group-${letter}`}>
                            <Table.Td
                              colSpan={6}
                              style={{ paddingTop: 12, paddingBottom: 4, paddingLeft: 4 }}
                            >
                              <Text
                                size="xs"
                                fw={700}
                                c="dimmed"
                                tt="uppercase"
                                style={{ letterSpacing: '0.08em' }}
                              >
                                {letter}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                          {group.map(renderRow)}
                        </>
                      ))
                  : filtered.map(renderRow)}
              </Table.Tbody>
            </Table>
          </div>
        </Paper>

        {grouped && letters.length > 1 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flexShrink: 0,
              alignItems: 'flex-start',
              paddingTop: 4,
            }}
          >
            {letters.map((letter) => (
              <Tooltip key={letter} label={letter} position="left" withArrow openDelay={400}>
                <UnstyledButton
                  onClick={() => scrollToLetter(letter)}
                  style={{
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--mantine-color-gray-6)',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'var(--mantine-color-default-hover)';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      'var(--mantine-color-violet-6)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      'var(--mantine-color-gray-6)';
                  }}
                >
                  {letter}
                </UnstyledButton>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CompanyForm
          company={editing}
          categories={categories}
          segments={segments}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </Box>
  );
};

export default CompaniesPage;
