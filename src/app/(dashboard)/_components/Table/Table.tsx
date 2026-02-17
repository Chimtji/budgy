'use client';

import { useEffect, useState } from 'react';
import { IconDots } from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Code,
  Group,
  Indicator,
  Table as ManTable,
  NumberFormatter,
  ScrollArea,
  Tooltip,
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import {
  getColorOfCategory,
  getLabelOfCategory,
  getLabelOfSegment,
  getMonthLabels,
  resolveCadenceLabel,
} from '@/data/helpers';
import { TCategoryName } from '@/data/types';
import { capitalizeTitle, convertFirebaseTimestamp, isNegative } from '@/utilities';
import EditModal from './EditModal';
import { sortItems } from './Table.helpers';
import BillsTableHead from './TableHead';
import classes from './Table.module.css';

export type TTableProps<TColumn extends string, TRow extends Record<TColumn, any>> = {
  columns: { [K in TColumn]: { width: string; label: string } };
  items: Record<string, TRow>;
  title?: string;
  editable?: boolean;
  editMultiple?: () => void;
  editSingle: () => void;
  fetchOccurences?: (id: string) => Promise<string[]>;
  onDelete?: (id: string) => void;
};

const Table = <TColumn extends string, TRow extends Record<TColumn, any>>({
  columns,
  items,
  editable,
  editMultiple,
  editSingle,
  fetchOccurences,
  onDelete,
}: TTableProps<TColumn, TRow>) => {
  const [scrolled, setScrolled] = useState(false);
  const [editItem, setEditItem] = useState<undefined | TRow>(undefined);
  const [editId, setEditId] = useState<undefined | string>(undefined);
  const [sortDirection, toggleSortDirection] = useToggle<'asc' | 'desc'>(['asc', 'desc']);
  const [filteredData, setFilteredData] = useState(items);
  const [sortColumn, setSortColumn] = useState<TColumn>(Object.keys(columns)[0] as TColumn);

  useEffect(() => {
    const sortedData = sortItems(sortColumn, items, sortDirection);
    setFilteredData(sortedData);
  }, [items]);

  const handleSort = (column: TColumn) => {
    setSortColumn(column);
    const sortedData = sortItems(column, items, sortDirection);
    setFilteredData(sortedData);
    toggleSortDirection();
  };

  const resolveDataDisplay = (key: string, value: any, item: TRow) => {
    switch (key) {
      case 'amount':
        return (
          <ManTable.Td key={key + value}>
            <NumberFormatter
              value={Math.abs(value)}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={1}
              suffix=" Kr."
            />
          </ManTable.Td>
        );
      case 'date':
        return (
          <ManTable.Td key={key + value}>
            {convertFirebaseTimestamp(value).toLocaleDateString()}
          </ManTable.Td>
        );
      case 'company':
        return (
          <ManTable.Td key={key + value}>
            <Group>
              <Avatar size="md" />
              {value}
            </Group>
          </ManTable.Td>
        );
      case 'description':
        return (
          <ManTable.Td key={key + value} c="dimmed">
            {value}
          </ManTable.Td>
        );
      case 'category':
        return (
          <ManTable.Td key={key + value}>
            <Badge variant="light" color={getColorOfCategory(value)}>
              {getLabelOfCategory(value)}
            </Badge>
          </ManTable.Td>
        );
      case 'segment':
        if ('category' in item) {
          return (
            <ManTable.Td key={key + value}>
              <Badge variant="light" color={getColorOfCategory(item.category as TCategoryName)}>
                {getLabelOfSegment(item.category as TCategoryName, value)}
              </Badge>
            </ManTable.Td>
          );
        }
      case 'status':
        return <ManTable.Td key={key + value}></ManTable.Td>;
      case 'due':
        return (
          <ManTable.Td key={key + value}>
            <Tooltip label={getMonthLabels(value).join(', ')}>
              <Group>
                {resolveCadenceLabel(value).map((val) => (
                  <Code key={key + value + val}>{val}</Code>
                ))}
              </Group>
            </Tooltip>
          </ManTable.Td>
        );
      default:
        return null;
    }
  };

  const handleEdit = (item: TRow, id: string) => {
    setEditItem(item);
    setEditId(id);
  };

  return (
    <ScrollArea
      h="100%"
      onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
      className={classes.wrapper}
    >
      <Box className={classes.root}>
        <ManTable className={classes.table}>
          <ManTable.Thead className={`${classes.head} ${scrolled && classes.scrolled}`}>
            <ManTable.Tr>
              {Object.keys(columns).map((column) => (
                <BillsTableHead
                  key={column}
                  sorted={sortColumn === column}
                  direction={sortDirection}
                  onSort={() => handleSort(column as TColumn)}
                  w={columns[column as TColumn]?.width}
                >
                  {capitalizeTitle(columns[column as TColumn]?.label)}
                </BillsTableHead>
              ))}
              {editable && <ManTable.Th className={classes.headItem}></ManTable.Th>}
            </ManTable.Tr>
          </ManTable.Thead>
          <ManTable.Tbody className={classes.body}>
            {Object.entries(filteredData).map(([id, item]) => (
              <ManTable.Tr key={id}>
                {Object.entries(item).map(([key, value]) => resolveDataDisplay(key, value, item))}
                <ManTable.Td>
                  <Indicator color="green" size={8}></Indicator>
                </ManTable.Td>
                {editable && (
                  <ManTable.Td>
                    <ActionIcon
                      radius="xl"
                      variant="subtle"
                      color="dark"
                      onClick={() => handleEdit(item, id)}
                    >
                      <IconDots />
                    </ActionIcon>
                  </ManTable.Td>
                )}
              </ManTable.Tr>
            ))}
          </ManTable.Tbody>
        </ManTable>
      </Box>
      {editItem && editId && (
        <EditModal<TRow>
          leftButtonLabel="Opdater Denne"
          rightButtonLabel="Opdater Alle"
          id={editId}
          item={editItem as TRow}
          onClose={() => {
            setEditItem(undefined);
            setEditId(undefined);
          }}
          onLeftButtonClick={editSingle}
          onRightButtonClick={editMultiple}
          fetchOccurences={fetchOccurences}
          onDelete={onDelete}
        />
      )}
    </ScrollArea>
  );
};

export default Table;
