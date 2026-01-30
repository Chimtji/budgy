import { useEffect, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Button, Group, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import EditModal from './EditModal';

export type TTableControls<T extends Record<string, any>> = {
  onSearch: (search: string) => Promise<T>;
  items: T;
  onAdd?: (item: any) => void;
  itemTemplate?: any;
};

const TableControls = <T extends Record<string, any>>({
  onSearch,
  items,
  onAdd,
  itemTemplate,
}: TTableControls<T>) => {
  const [template, setTemplate] = useState(itemTemplate);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const [filteredData, setFilteredData] = useState<T>(items);

  const handleSearch = (search: string) => {
    onSearch(search).then((result) => setFilteredData(result));
  };

  useEffect(() => {
    handleSearch(search);
  }, [debouncedSearch]);

  return (
    <Group justify="space-between">
      <Group>
        <TextInput
          radius="md"
          placeholder="Search.."
          leftSection={<IconSearch size={20} />}
          variant="filled"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
          }}
          rightSection={<Text>{Object.keys(filteredData).length}</Text>}
          styles={{
            input: {
              backgroundColor: `var(--mantine-color-dark-8)`,
              // border: `1px solid var(--mantine-color-dark-6)`,
            },
          }}
        />
        {onAdd && (
          <Button variant="light" onClick={() => setShowAdd(true)}>
            Opret Ny
          </Button>
        )}
        {showAdd && onAdd && (
          <EditModal
            id={''}
            item={template}
            onClose={() => setShowAdd(false)}
            leftButtonLabel="Opret"
            onLeftButtonClick={onAdd}
          />
        )}
      </Group>
    </Group>
  );
};

export default TableControls;
