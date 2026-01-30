'use client';

import { useEffect, useState } from 'react';
import { IconDots } from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Indicator,
  NumberFormatter,
  rem,
  ScrollArea,
  Table,
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { getColorOfCategory, getLabelOfCategory, getLabelOfSegment } from '@/data/helpers';
import {
  useTransactionsStore,
  type TTransaction,
  type TTransactions,
} from '@/stores/transactions/transactionsStore';
import { capitalizeTitle, convertFirebaseTimestamp, isNegative } from '@/utilities';
import EditModal from './EditModal';
import { resolveStatus, sortTransactions } from './Table.helpers';
import TableHead from './TableHead';
import classes from './Table.module.css';

type TProps = {
  data: TTransactions;
};

export type TColumns = keyof TTransaction | 'status';

const columns: Partial<{
  [key in TColumns]: {
    width: string;
  };
}> = {
  amount: {
    width: rem('90px'),
  },
  company: {
    width: rem('90px'),
  },
  date: {
    width: rem('100px'),
  },
  description: {
    width: rem('275px'),
  },
  category: {
    width: rem('90px'),
  },
  segment: {
    width: rem('90px'),
  },
  status: {
    width: rem('40px'),
  },
};

const TransactionsTable: React.FC<TProps> = ({ data }) => {
  const getOccurences = useTransactionsStore.getState().getOccurences;

  const [edit, setEdit] = useState<TTransaction | undefined>(undefined);
  const [scrolled, setScrolled] = useState(false);
  const [filteredData, setFilteredData] = useState<TTransactions>(data);
  const [sortDirection, toggleSortDirection] = useToggle<'asc' | 'desc'>(['asc', 'desc']);
  const [sortColumn, setSortColumn] = useState<keyof TTransaction>('date');
  const [occurences, setOccurences] = useState<string[]>([]);

  useEffect(() => {
    if (edit) {
      getOccurences(edit).then((res) => setOccurences(res));
    }
  }, [edit]);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleEdit = (transaction: TTransaction) => {
    setEdit(transaction);
  };

  const handleSort = (column: keyof TTransaction) => {
    setSortColumn(column);

    const sortedData = sortTransactions(column, data, sortDirection);

    setFilteredData(sortedData);
    toggleSortDirection();
  };

  return (
    <ScrollArea
      h="100%"
      onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
      className={classes.wrapper}
    >
      <Box className={classes.root}>
        <Table className={classes.table}>
          <Table.Thead className={`${classes.head} ${scrolled && classes.scrolled}`}>
            <Table.Tr>
              {Object.keys(columns).map((column) => (
                <TableHead
                  key={column}
                  sorted={sortColumn === (column as keyof TTransaction)}
                  direction={sortDirection}
                  onSort={() => handleSort(column as keyof TTransaction)}
                  w={columns[column as keyof typeof columns]?.width}
                >
                  {capitalizeTitle(column)}
                </TableHead>
              ))}
              {/* Edit button */}
              <Table.Th className={classes.headItem}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody className={classes.body}>
            {/* Spacing between header and rows */}
            <Table.Tr style={{ pointerEvents: 'none' }}>
              {' '}
              <Table.Td></Table.Td>
            </Table.Tr>

            {Object.entries(filteredData).map(([id, transaction]) => (
              <Table.Tr key={id}>
                <Table.Td c={isNegative(transaction.amount) ? 'red' : 'green'}>
                  <NumberFormatter
                    value={Math.abs(transaction.amount)}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={1}
                    suffix=" Kr."
                  />
                </Table.Td>
                <Table.Td>
                  <Group>
                    <Avatar size="md" />
                    {transaction.company}
                  </Group>
                </Table.Td>
                <Table.Td>
                  {convertFirebaseTimestamp(transaction.date).toLocaleDateString()}
                </Table.Td>
                <Table.Td c="dimmed">{transaction.description}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={getColorOfCategory(transaction.category)}>
                    {getLabelOfCategory(transaction.category)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={getColorOfCategory(transaction.category)}>
                    {getLabelOfSegment(transaction.category, transaction.segment)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {resolveStatus(transaction) === 'pending' ? (
                    <Indicator position="middle-center" color="blue" />
                  ) : (
                    <Indicator position="middle-center" color="green" />
                  )}
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    radius="xl"
                    variant="subtle"
                    color="dark"
                    onClick={() => handleEdit(transaction)}
                  >
                    <IconDots />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
      {edit && (
        <EditModal
          onClose={() => setEdit(undefined)}
          transaction={edit as TTransaction}
          occurences={occurences}
        />
      )}
    </ScrollArea>
  );
};

export default TransactionsTable;
