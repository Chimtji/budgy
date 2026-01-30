import { Group, Stack, Title } from '@mantine/core';
import Table, { TTableProps } from './Table';
import TableControls, { TTableControls } from './TableControls';

type TProps<TColumn extends string, TRow extends Record<TColumn, any>> = TTableProps<
  TColumn,
  TRow
> &
  TTableControls<Record<string, TRow>>;

const TableWrapper = <TColumn extends string, TRow extends Record<TColumn, any>>({
  onSearch,
  items,
  columns,
  editSingle,
  editMultiple,
  editable,
  fetchOccurences,
  onAdd,
  onDelete,
  itemTemplate,
  title,
}: TProps<TColumn, TRow>) => {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{title || 'title'}</Title>
        <TableControls
          items={items}
          onSearch={onSearch}
          onAdd={onAdd}
          itemTemplate={itemTemplate}
        />
      </Group>
      <Table<keyof typeof columns, TRow>
        items={items}
        columns={columns}
        editSingle={editSingle}
        editMultiple={editMultiple}
        fetchOccurences={fetchOccurences}
        onDelete={onDelete}
        editable={editable}
      />
    </Stack>
  );
};

export default TableWrapper;
