import { useEffect, useState, type ReactNode } from 'react';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { Center, Group, MantineStyleProps, Table, Text, UnstyledButton } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { TBillRow } from './BillsTable';
import classes from './BillsTable.module.css';

type THeadProps = MantineStyleProps & {
  onSort: (sortColumn: string, sortDirection: TTableHeadProps['direction']) => void;
};

type TTableHeadProps = {
  children?: ReactNode;
  direction?: 'asc' | 'desc';
  sorted?: boolean;
  onSort?: () => void;
  w?: string;
};

const BillsTableHead = ({ onSort }: THeadProps) => {
  const [sortColumn, setSortColumn] = useState<keyof TBillRow>('company');
  const [sortDirection, toggleSortDirection] = useToggle<'asc' | 'desc'>(['asc', 'desc']);

  const handleSort = (column: keyof TBillRow) => {
    setSortColumn(column);

    if (sortColumn === column) {
      toggleSortDirection();
    }
  };

  useEffect(() => {
    onSort?.(sortColumn, sortDirection);
  }, [sortColumn, sortDirection]);

  const TableHead = ({ children, sorted, direction, onSort, w }: TTableHeadProps) => {
    const Icon = direction === 'asc' ? IconSortAscending : IconSortDescending;

    return (
      <Table.Th className={classes.headItem} w={w}>
        <UnstyledButton onClick={onSort} className={classes.control}>
          <Group>
            <Text fw={sorted ? 700 : 400} fz="sm">
              {children}
            </Text>

            <Center className={classes.icon} opacity={!sorted ? 0 : 1}>
              <Icon size={16} stroke={3} />
            </Center>
          </Group>
        </UnstyledButton>
      </Table.Th>
    );
  };

  return (
    <>
      <TableHead
        sorted={sortColumn === 'amount'}
        direction={sortDirection}
        onSort={() => handleSort('amount')}
      >
        Beløb
      </TableHead>
      <TableHead
        sorted={sortColumn === 'company'}
        direction={sortDirection}
        onSort={() => handleSort('company')}
      >
        Forhandler
      </TableHead>
      <TableHead
        sorted={sortColumn === 'category'}
        direction={sortDirection}
        onSort={() => handleSort('category')}
      >
        Kategori
      </TableHead>
      <TableHead
        sorted={sortColumn === 'segment'}
        direction={sortDirection}
        onSort={() => handleSort('segment')}
      >
        Segment
      </TableHead>
      <TableHead
        sorted={sortColumn === 'due'}
        direction={sortDirection}
        onSort={() => handleSort('due')}
      >
        Betales
      </TableHead>
      <TableHead
        sorted={sortColumn === 'status'}
        direction={sortDirection}
        onSort={() => handleSort('status')}
      >
        Status
      </TableHead>
    </>
  );
};

export default BillsTableHead;
